'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function registrarPesagem(pedidoId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pesoTotalKg = parseFloat(formData.get('peso_total_kg') as string)
  if (!pesoTotalKg || pesoTotalKg <= 0) throw new Error('Peso inválido')

  // Busca o pedido com seu carregamento vinculado
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, carregamento_id, quantidade_unidades')
    .eq('id', pedidoId)
    .eq('owner_id', user.id)
    .single()

  if (pedidoErr || !pedido) throw new Error('Pedido não encontrado')

  type ParadaItemDB = { produto: string; quantidade_kg: number; quantidade_unidades?: number | null }

  // Busca pedido completo para atualizar itens com pesos reais
  const { data: pedidoCompleto } = await supabase
    .from('pedidos')
    .select('itens')
    .eq('id', pedidoId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itensAtuais = Array.isArray(pedidoCompleto?.itens) ? (pedidoCompleto!.itens as any[]) : null

  // Distribui o peso real pelos itens do pedido proporcionalmente ao peso estimado
  let itensAtualizados = itensAtuais
  if (itensAtuais && itensAtuais.length > 0) {
    const totalEstimado = itensAtuais.reduce((s: number, it: ParadaItemDB) => s + (it.quantidade_kg ?? 0), 0)
    if (totalEstimado > 0) {
      itensAtualizados = itensAtuais.map((item: ParadaItemDB) => ({
        ...item,
        quantidade_kg: Math.round((item.quantidade_kg / totalEstimado) * pesoTotalKg * 100) / 100,
      }))
    } else {
      // Distribui igualmente se não há estimativas
      const kgPorItem = Math.round((pesoTotalKg / itensAtuais.length) * 100) / 100
      itensAtualizados = itensAtuais.map((item: ParadaItemDB) => ({ ...item, quantidade_kg: kgPorItem }))
    }
  }

  // Rastreia kg real por produto para atualizar paradas e médias históricas
  const kgRealPorProduto: Record<string, number> = {}
  if (itensAtualizados) {
    for (const item of itensAtualizados as ParadaItemDB[]) {
      if (item.produto) kgRealPorProduto[item.produto] = (kgRealPorProduto[item.produto] ?? 0) + item.quantidade_kg
    }
  }

  const produtosAtualizados = new Set<string>()

  if (pedido.carregamento_id) {
    const { data: paradas } = await supabase
      .from('paradas')
      .select('id, produto, itens, quantidade_unidades, quantidade_kg')
      .eq('carregamento_id', pedido.carregamento_id)

    if (paradas && paradas.length > 0) {
      const totalUnidades = paradas.reduce((s, p) => s + (p.quantidade_unidades ?? 0), 0)
      const pesoPorUnidade = totalUnidades > 0 ? pesoTotalKg / totalUnidades : null

      for (const parada of paradas) {
        let paradaKg: number
        if (totalUnidades > 0 && parada.quantidade_unidades) {
          paradaKg = Math.round((parada.quantidade_unidades / totalUnidades) * pesoTotalKg * 100) / 100
        } else if (paradas.length === 1) {
          paradaKg = pesoTotalKg
        } else {
          paradaKg = Math.round((pesoTotalKg / paradas.length) * 100) / 100
        }

        const novoPesoPorUnidade = pesoPorUnidade != null && parada.quantidade_unidades ? pesoPorUnidade : null

        // Atualiza itens da parada com peso real proporcional ao estimado
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itensParada = Array.isArray((parada as any).itens) ? (parada as any).itens as ParadaItemDB[] : null
        let itensParadaAtualizados = itensParada
        if (itensParada && itensParada.length > 0) {
          const totalEstParada = itensParada.reduce((s, it) => s + (it.quantidade_kg ?? 0), 0)
          itensParadaAtualizados = totalEstParada > 0
            ? itensParada.map(it => ({ ...it, quantidade_kg: Math.round((it.quantidade_kg / totalEstParada) * paradaKg * 100) / 100 }))
            : itensParada.map(it => ({ ...it, quantidade_kg: Math.round((paradaKg / itensParada.length) * 100) / 100 }))
        }

        await supabase
          .from('paradas')
          .update({
            quantidade_kg: paradaKg,
            ...(itensParadaAtualizados ? { itens: itensParadaAtualizados } : {}),
            ...(novoPesoPorUnidade != null ? { peso_por_unidade: novoPesoPorUnidade } : {}),
          })
          .eq('id', parada.id)

        const produtoPrincipal = parada.produto
        if (novoPesoPorUnidade != null && produtoPrincipal) produtosAtualizados.add(produtoPrincipal)
      }

      // Recalcula peso_unitario_kg médio histórico por produto
      for (const produtoValue of produtosAtualizados) {
        const { data: historico } = await supabase
          .from('paradas')
          .select('peso_por_unidade, carregamentos!inner(owner_id)')
          .eq('produto', produtoValue)
          .not('peso_por_unidade', 'is', null)
          .eq('carregamentos.owner_id', user.id)

        if (historico && historico.length > 0) {
          const media = historico.reduce((s, h) => s + (h.peso_por_unidade as number), 0) / historico.length
          await supabase
            .from('produtos')
            .update({ peso_unitario_kg: Math.round(media * 100) / 100 })
            .eq('value', produtoValue)
            .eq('owner_id', user.id)
        }
      }
    }
  }

  // Atualiza o pedido: peso real total, itens com pesos ajustados e status entregue
  await supabase
    .from('pedidos')
    .update({
      quantidade_kg: pesoTotalKg,
      status: 'entregue',
      ...(itensAtualizados ? { itens: itensAtualizados } : {}),
    })
    .eq('id', pedidoId)
    .eq('owner_id', user.id)

  revalidatePath('/pesagens')
  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/produtos')
  revalidatePath('/dashboard')
  redirect('/pesagens')
}
