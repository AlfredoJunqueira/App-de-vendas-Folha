'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface PedidoItemRaw {
  produto: string
  quantidade_unidades?: number | null
  quantidade_kg: number
  preco_kg: number
}

function parseItens(formData: FormData): PedidoItemRaw[] {
  const raw = formData.get('itens') as string
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is PedidoItemRaw =>
        typeof i.produto === 'string' &&
        typeof i.quantidade_kg === 'number' &&
        typeof i.preco_kg === 'number'
    )
  } catch {
    return []
  }
}

function computeTotals(itens: PedidoItemRaw[]) {
  const valorTotal = itens.reduce((s, i) => s + i.quantidade_kg * i.preco_kg, 0)
  const quantidadeKg = itens.reduce((s, i) => s + i.quantidade_kg, 0)
  const quantidadeUnidades = itens.reduce((s, i) => s + (i.quantidade_unidades ?? 0), 0) || null
  const produto = itens[0]?.produto ?? ''
  const precoKg = itens[0]?.preco_kg ?? 0
  return { valorTotal, quantidadeKg, quantidadeUnidades, produto, precoKg }
}

export async function criarPedido(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const itens = parseItens(formData)
  const { valorTotal, quantidadeKg, quantidadeUnidades, produto, precoKg } = computeTotals(itens)

  const { data: novoPedido, error } = await supabase.from('pedidos').insert({
    cliente_id: formData.get('cliente_id') as string,
    produto,
    quantidade_kg: quantidadeKg,
    quantidade_unidades: quantidadeUnidades,
    preco_kg: precoKg,
    valor_total: valorTotal,
    itens,
    data_fechamento: formData.get('data_fechamento') as string || null,
    data_entrega_prevista: formData.get('data_entrega_prevista') as string || null,
    status: formData.get('status') as string || 'em_aberto',
    condicao_pagamento: formData.get('condicao_pagamento') as string || null,
    data_vencimento: formData.get('data_vencimento') as string || null,
    num_parcelas: formData.get('num_parcelas') ? parseInt(formData.get('num_parcelas') as string) : null,
    observacoes: formData.get('observacoes') as string || null,
    local_carregamento_id: formData.get('local_carregamento_id') as string || null,
    owner_id: user.id,
  }).select('id').single()

  if (error || !novoPedido) throw new Error(error?.message || 'Erro ao criar pedido')

  revalidatePath('/pedidos')
  revalidatePath('/dashboard')
  redirect(`/pedidos/${novoPedido.id}`)
}

export async function atualizarPedido(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const itens = parseItens(formData)
  const { valorTotal, quantidadeKg, quantidadeUnidades, produto, precoKg } = computeTotals(itens)

  const { error } = await supabase
    .from('pedidos')
    .update({
      cliente_id: formData.get('cliente_id') as string,
      produto,
      quantidade_kg: quantidadeKg,
      quantidade_unidades: quantidadeUnidades,
      preco_kg: precoKg,
      valor_total: valorTotal,
      itens,
      data_fechamento: formData.get('data_fechamento') as string || null,
      data_entrega_prevista: formData.get('data_entrega_prevista') as string || null,
      status: formData.get('status') as string,
      condicao_pagamento: formData.get('condicao_pagamento') as string || null,
      data_vencimento: formData.get('data_vencimento') as string || null,
      num_parcelas: formData.get('num_parcelas') ? parseInt(formData.get('num_parcelas') as string) : null,
      observacoes: formData.get('observacoes') as string || null,
      local_carregamento_id: formData.get('local_carregamento_id') as string || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/pedidos/${id}`)
  revalidatePath('/pedidos')
  revalidatePath('/dashboard')
  revalidatePath('/pesagens')
  redirect(`/pedidos/${id}`)
}

export async function excluirPedido(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/pedidos')
  revalidatePath('/dashboard')
  redirect('/pedidos')
}
