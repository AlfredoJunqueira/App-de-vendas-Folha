import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { executarRegistroPesagem } from '@/lib/services/pesagem-service'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  // Autenticação via API key
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.PESAGEM_WEBHOOK_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { pedido_id?: string; peso_kg?: number; ticket?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { pedido_id, peso_kg } = body

  if (!pedido_id || typeof pedido_id !== 'string') {
    return NextResponse.json({ error: 'pedido_id obrigatório' }, { status: 422 })
  }
  if (!peso_kg || typeof peso_kg !== 'number' || peso_kg <= 0) {
    return NextResponse.json({ error: 'peso_kg deve ser um número positivo' }, { status: 422 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Busca o pedido para validar existência e pegar owner_id
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, status, owner_id')
    .eq('id', pedido_id)
    .single()

  if (pedidoErr || !pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  const STATUS_POS_ENTREGA = ['entregue', 'aguardando_nf', 'aguardando_boleto', 'finalizado']
  if (STATUS_POS_ENTREGA.includes(pedido.status)) {
    return NextResponse.json({ error: 'Pedido já foi entregue' }, { status: 409 })
  }

  try {
    const result = await executarRegistroPesagem(supabase, pedido_id, peso_kg, pedido.owner_id)

    revalidatePath('/pesagens')
    revalidatePath('/pedidos')
    revalidatePath(`/pedidos/${pedido_id}`)
    revalidatePath('/dashboard')

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
