import { SupabaseClient } from '@supabase/supabase-js'

type ParadaItemDB = { produto: string; quantidade_kg: number; quantidade_unidades?: number | null }
type PedidoItemWithPreco = { produto: string; quantidade_kg: number; preco_kg?: number; quantidade_unidades?: number | null }

export interface PesagemResult {
  pedido_id: string
  peso_kg: number
  valor_total: number
  status: string
}

export async function executarRegistroPesagem(
  supabase: SupabaseClient,
  pedidoId: string,
  pesoTotalKg: number,
  ownerId: string
): Promise<PesagemResult> {
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, carregamento_id, quantidade_unidades')
    .eq('id', pedidoId)
    .single()

  if (pedidoErr || !pedido) throw new Error('Pedido não encontrado')

  const { data: pedidoCompleto } = await supabase
    .from('pedidos')
    .select('itens')
    .eq('id', pedidoId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itensAtuais = Array.isArray(pedidoCompleto?.itens) ? (pedidoCompleto!.itens as any[]) : null

  let itensAtualizados = itensAtuais
  if (itensAtuais && itensAtuais.length > 0) {
    const totalEstimado = itensAtuais.reduce((s: number, it: ParadaItemDB) => s + (it.quantidade_kg ?? 0), 0)
    if (totalEstimado > 0) {
      itensAtualizados = itensAtuais.map((item: ParadaItemDB) => ({
        ...item,
        quantidade_kg: Math.round((item.quantidade_kg / totalEstimado) * pesoTotalKg * 100) / 100,
      }))
    } else {
      const kgPorItem = Math.round((pesoTotalKg / itensAtuais.length) * 100) / 100
      itensAtualizados = itensAtuais.map((item: ParadaItemDB) => ({ ...item, quantidade_kg: kgPorItem }))
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

        if (novoPesoPorUnidade != null && parada.produto) produtosAtualizados.add(parada.produto)
      }

      for (const produtoValue of produtosAtualizados) {
        const { data: historico } = await supabase
          .from('paradas')
          .select('peso_por_unidade, carregamentos!inner(owner_id)')
          .eq('produto', produtoValue)
          .not('peso_por_unidade', 'is', null)
          .eq('carregamentos.owner_id', ownerId)

        if (historico && historico.length > 0) {
          const media = historico.reduce((s, h) => s + (h.peso_por_unidade as number), 0) / historico.length
          await supabase
            .from('produtos')
            .update({ peso_unitario_kg: Math.round(media * 100) / 100 })
            .eq('value', produtoValue)
            .eq('owner_id', ownerId)
        }
      }
    }
  }

  const novoValorTotal = itensAtualizados
    ? Math.round(
        (itensAtualizados as PedidoItemWithPreco[]).reduce(
          (s, it) => s + it.quantidade_kg * (it.preco_kg ?? 0),
          0
        ) * 100
      ) / 100
    : null

  const { error: updateErr } = await supabase
    .from('pedidos')
    .update({
      quantidade_kg: pesoTotalKg,
      status: 'entregue',
      ...(itensAtualizados ? { itens: itensAtualizados } : {}),
      ...(novoValorTotal != null ? { valor_total: novoValorTotal } : {}),
    })
    .eq('id', pedidoId)

  if (updateErr) throw new Error(`Erro ao atualizar pedido: ${updateErr.message}`)

  return {
    pedido_id: pedidoId,
    peso_kg: pesoTotalKg,
    valor_total: novoValorTotal ?? 0,
    status: 'entregue',
  }
}
