'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ParadaItem = { produto: string; quantidade_kg: number; quantidade_unidades?: number | null }
type Parada = {
  cliente_id: string
  itens?: ParadaItem[] | null
  produto?: string | null
  quantidade_kg?: number | null
  quantidade_unidades?: number | null
  pedido_id?: string | null
  ordem: number
  observacoes?: string
}

function validarData(data: string): string {
  // Garante que o ano tem 4 dígitos e é >= 2000 para evitar entradas como "1926"
  const ano = parseInt(data?.slice(0, 4) ?? '0', 10)
  if (!data || isNaN(ano) || ano < 2000 || ano > 2100) {
    throw new Error(`Data inválida: "${data}". Use o formato AAAA-MM-DD com ano completo (ex: 2026-03-11).`)
  }
  return data
}

export async function criarCarregamento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clienteIdCriar = formData.get('cliente_id') as string || null

  const baseInsert = {
    data: validarData(formData.get('data') as string),
    transportador_nome: formData.get('transportador_nome') as string || null,
    transportador_telefone: formData.get('transportador_telefone') as string || null,
    transportador_placa: formData.get('transportador_placa') as string || null,
    local_carregamento_id: formData.get('local_carregamento_id') as string || null,
    status: 'rascunho',
    owner_id: user.id,
  }

  // Tenta com cliente_id (migration 013). Fallback sem o campo se a coluna não existir.
  const res1 = await supabase
    .from('carregamentos')
    .insert(clienteIdCriar ? { ...baseInsert, cliente_id: clienteIdCriar } : baseInsert)
    .select('id')
    .single()

  const result = res1.error?.message?.includes('cliente_id')
    ? await supabase.from('carregamentos').insert(baseInsert).select('id').single()
    : res1

  if (result.error || !result.data) throw new Error(result.error?.message || 'Erro ao criar carregamento')
  const carregamento = result.data

  // Inserir paradas
  const paradasJson = formData.get('paradas') as string
  if (paradasJson) {
    const paradas: Parada[] = JSON.parse(paradasJson)
    if (paradas.length > 0) {
      const { error: paradasError } = await supabase.from('paradas').insert(
        paradas.map(p => ({ ...p, carregamento_id: carregamento.id }))
      )
      if (paradasError) throw new Error(paradasError.message)
    }
  }

  revalidatePath('/carregamentos')
  revalidatePath('/dashboard')
  redirect(`/carregamentos/${carregamento.id}`)
}

export async function criarCarregamentoDoPedido(pedidoId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', pedidoId)
    .eq('owner_id', user.id)
    .single() as { data: Record<string, unknown> | null; error: unknown }

  if (pedidoErr || !pedido) redirect(`/pedidos/${pedidoId}`)

  const hoje = new Date().toISOString().split('T')[0]

  const { data: carregamento, error } = await supabase
    .from('carregamentos')
    .insert({
      data: (pedido.data_entrega_prevista as string) || hoje,
      status: 'rascunho',
      owner_id: user.id,
      local_carregamento_id: (pedido.local_carregamento_id as string) || null,
    })
    .select('id')
    .single()

  if (error || !carregamento) redirect(`/pedidos/${pedidoId}`)

  // Cria UMA parada por pedido; múltiplos produtos ficam em itens[]
  const itens = pedido.itens as Array<{ produto: string; quantidade_kg: number; quantidade_unidades?: number | null }> | null
  const itensDaParada = Array.isArray(itens) && itens.length > 0
    ? itens
    : [{ produto: (pedido.produto as string) ?? '', quantidade_kg: (pedido.quantidade_kg as number) ?? 0, quantidade_unidades: (pedido.quantidade_unidades as number | null) ?? null }]

  const totalKg = itensDaParada.reduce((s, i) => s + (i.quantidade_kg ?? 0), 0)
  const totalUnidades = itensDaParada.reduce((s, i) => s + (i.quantidade_unidades ?? 0), 0)

  await supabase.from('paradas').insert({
    carregamento_id: carregamento.id,
    pedido_id: pedidoId,
    cliente_id: pedido.cliente_id as string,
    itens: itensDaParada,
    produto: itensDaParada[0].produto,
    quantidade_kg: totalKg,
    quantidade_unidades: totalUnidades > 0 ? totalUnidades : null,
    ordem: 1,
  })

  // Vincula o pedido ao carregamento criado (coluna carregamento_id — migration 011)
  await supabase
    .from('pedidos')
    .update({ carregamento_id: carregamento.id } as Record<string, unknown>)
    .eq('id', pedidoId)
    .eq('owner_id', user.id)

  revalidatePath('/carregamentos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/dashboard')
  redirect(`/carregamentos/${carregamento.id}/editar`)
}

export async function criarPedidoDaParada(paradaId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca a parada com o carregamento
  const { data: parada, error: paradaErr } = await supabase
    .from('paradas')
    .select('id, cliente_id, produto, quantidade_kg, quantidade_unidades, carregamento_id, carregamentos(data, local_carregamento_id, owner_id)')
    .eq('id', paradaId)
    .single() as {
      data: {
        id: string
        cliente_id: string
        produto: string
        quantidade_kg: number
        quantidade_unidades: number | null
        carregamento_id: string
        carregamentos: { data: string; local_carregamento_id: string | null; owner_id: string } | null
      } | null
      error: unknown
    }

  if (paradaErr || !parada || parada.carregamentos?.owner_id !== user.id) redirect('/carregamentos')

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      owner_id: user.id,
      cliente_id: parada.cliente_id,
      produto: parada.produto,
      quantidade_kg: parada.quantidade_kg,
      quantidade_unidades: parada.quantidade_unidades,
      itens: [{
        produto: parada.produto,
        quantidade_kg: parada.quantidade_kg,
        quantidade_unidades: parada.quantidade_unidades,
        preco_kg: 0,
      }],
      preco_kg: 0,
      data_entrega_prevista: parada.carregamentos?.data ?? null,
      local_carregamento_id: parada.carregamentos?.local_carregamento_id ?? null,
      carregamento_id: parada.carregamento_id,
      status: 'confirmado',
    })
    .select('id')
    .single()

  if (error || !pedido) throw new Error(error?.message || 'Erro ao criar pedido')

  // Vincula o pedido criado de volta à parada
  await supabase.from('paradas').update({ pedido_id: pedido.id }).eq('id', paradaId)

  revalidatePath('/pedidos')
  revalidatePath(`/carregamentos/${parada.carregamento_id}`)
  redirect(`/pedidos/${pedido.id}/editar`)
}

export async function moverCarregamento(id: string, novaData: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('carregamentos')
    .update({ data: novaData })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/carregamentos')
  revalidatePath(`/carregamentos/${id}`)
}

export async function excluirCarregamento(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('carregamentos')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/carregamentos')
  revalidatePath('/dashboard')
  const mes = formData.get('mes') as string | null
  redirect(mes ? `/carregamentos?mes=${mes}` : '/carregamentos')
}

export async function atualizarCarregamento(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const status = formData.get('status') as string
  const clienteIdAtualizar = formData.get('cliente_id') as string || null

  const baseUpdate = {
    data: validarData(formData.get('data') as string),
    transportador_nome: formData.get('transportador_nome') as string || null,
    transportador_telefone: formData.get('transportador_telefone') as string || null,
    transportador_placa: formData.get('transportador_placa') as string || null,
    local_carregamento_id: formData.get('local_carregamento_id') as string || null,
    ...(status ? { status } : {}),
  }

  // Tenta com cliente_id (migration 013). Fallback sem o campo se a coluna não existir.
  const upd1 = await supabase
    .from('carregamentos')
    .update(clienteIdAtualizar ? { ...baseUpdate, cliente_id: clienteIdAtualizar } : baseUpdate)
    .eq('id', id)
    .eq('owner_id', user.id)

  const updError = upd1.error?.message?.includes('cliente_id')
    ? (await supabase.from('carregamentos').update(baseUpdate).eq('id', id).eq('owner_id', user.id)).error
    : upd1.error

  if (updError) throw new Error(updError.message)

  // Reinsere paradas (delete + insert)
  await supabase.from('paradas').delete().eq('carregamento_id', id)

  const paradasJson = formData.get('paradas') as string
  if (paradasJson) {
    const paradas: Parada[] = JSON.parse(paradasJson)
    if (paradas.length > 0) {
      const { error: paradasError } = await supabase.from('paradas').insert(
        paradas.map(p => ({ ...p, carregamento_id: id }))
      )
      if (paradasError) throw new Error(paradasError.message)

      // Sincroniza peso do pedido vinculado com o peso real da parada
      for (const parada of paradas) {
        if (!parada.pedido_id) continue

        const itensDaParada = Array.isArray(parada.itens) && parada.itens.length > 0 ? parada.itens : null
        const totalKgParada = itensDaParada
          ? itensDaParada.reduce((s, it) => s + (Number(it.quantidade_kg) || 0), 0)
          : (Number(parada.quantidade_kg) || 0)

        if (totalKgParada <= 0) continue

        // Busca itens atuais do pedido para preservar preco_kg e unidades
        const { data: pedidoAtual } = await supabase
          .from('pedidos')
          .select('itens, preco_kg, quantidade_unidades')
          .eq('id', parada.pedido_id)
          .eq('owner_id', user.id)
          .single()

        if (!pedidoAtual) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itensAtuais = Array.isArray(pedidoAtual.itens) ? (pedidoAtual.itens as any[]) : null

        // Reconstrói itens do pedido com os pesos reais da parada
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let itensAtualizados: any[] | null = itensAtuais
        if (itensDaParada && itensAtuais) {
          itensAtualizados = itensDaParada.map(it => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const itemPedido = itensAtuais.find((pi: any) => pi.produto === it.produto)
            return {
              produto: it.produto,
              quantidade_kg: Number(it.quantidade_kg),
              quantidade_unidades: it.quantidade_unidades ?? null,
              preco_kg: itemPedido?.preco_kg ?? pedidoAtual.preco_kg ?? 0,
            }
          })
        } else if (itensAtuais && itensAtuais.length > 0) {
          // Parada produto único — distribui proporcional ao estimado
          const totalEst = itensAtuais.reduce((s: number, it: any) => s + (it.quantidade_kg ?? 0), 0)
          itensAtualizados = totalEst > 0
            ? itensAtuais.map((it: any) => ({ ...it, quantidade_kg: Math.round((it.quantidade_kg / totalEst) * totalKgParada * 100) / 100 }))
            : itensAtuais
        }

        const valorTotal = itensAtualizados
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? itensAtualizados.reduce((s: number, it: any) => s + (Number(it.quantidade_kg) * Number(it.preco_kg || 0)), 0)
          : totalKgParada * Number(pedidoAtual.preco_kg || 0)

        await supabase
          .from('pedidos')
          .update({
            quantidade_kg: totalKgParada,
            valor_total: Math.round(valorTotal * 100) / 100,
            ...(itensAtualizados ? { itens: itensAtualizados } : {}),
          })
          .eq('id', parada.pedido_id)
          .eq('owner_id', user.id)

        // Sincroniza quantidade_unidades na parada recém-inserida a partir do pedido
        const unidadesDoPedido = (pedidoAtual as { quantidade_unidades?: number | null }).quantidade_unidades ?? null
        if (unidadesDoPedido != null) {
          await supabase
            .from('paradas')
            .update({ quantidade_unidades: unidadesDoPedido })
            .eq('carregamento_id', id)
            .eq('pedido_id', parada.pedido_id)
        }

        revalidatePath(`/pedidos/${parada.pedido_id}`)
      }
    }
  }

  revalidatePath(`/carregamentos/${id}`)
  revalidatePath('/carregamentos')
  revalidatePath('/dashboard')
  redirect(`/carregamentos/${id}`)
}
