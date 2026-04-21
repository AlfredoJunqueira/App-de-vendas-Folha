'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { executarRegistroPesagem } from '@/lib/services/pesagem-service'

export async function registrarPesagem(pedidoId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pesoTotalKg = parseFloat(formData.get('peso_total_kg') as string)
  if (!pesoTotalKg || pesoTotalKg <= 0) throw new Error('Peso inválido')

  // Valida que o pedido pertence ao usuário
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id')
    .eq('id', pedidoId)
    .eq('owner_id', user.id)
    .single()

  if (pedidoErr || !pedido) throw new Error('Pedido não encontrado')

  await executarRegistroPesagem(supabase, pedidoId, pesoTotalKg, user.id)

  revalidatePath('/pesagens')
  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/produtos')
  revalidatePath('/dashboard')
  redirect('/pesagens')
}
