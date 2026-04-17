import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const TRANSICOES_VALIDAS: Record<string, string> = {
  confirmado: 'em_rota',
  em_rota: 'entregue',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const { status: novoStatus, token: tokenBody } = body

  // Valida que o token no body bate com o da URL
  if (tokenBody !== token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const supabase = createServiceClient()

  // Busca carregamento pelo token
  const { data: carregamento } = await supabase
    .from('carregamentos')
    .select('id, status')
    .eq('link_publico_token', token)
    .single()

  if (!carregamento) {
    return NextResponse.json({ error: 'Carregamento não encontrado' }, { status: 404 })
  }

  // Valida transição de status
  const statusEsperado = TRANSICOES_VALIDAS[carregamento.status]
  if (novoStatus !== statusEsperado) {
    return NextResponse.json({ error: 'Transição de status inválida' }, { status: 400 })
  }

  const { error } = await supabase
    .from('carregamentos')
    .update({ status: novoStatus })
    .eq('id', carregamento.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: novoStatus })
}
