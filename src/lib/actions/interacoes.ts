'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarInteracao(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clienteId = formData.get('cliente_id') as string

  const { error } = await supabase.from('interacoes').insert({
    cliente_id: clienteId,
    data: formData.get('data') as string,
    tipo: formData.get('tipo') as string,
    assunto: formData.get('assunto') as string || null,
    proxima_acao: formData.get('proxima_acao') as string || null,
    data_proxima_acao: formData.get('data_proxima_acao') as string || null,
    owner_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/interacoes')
  revalidatePath('/dashboard')
  redirect(`/clientes/${clienteId}`)
}

export async function atualizarInteracao(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: interacao } = await supabase
    .from('interacoes')
    .select('cliente_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!interacao) redirect('/interacoes')

  const { error } = await supabase
    .from('interacoes')
    .update({
      data: formData.get('data') as string,
      tipo: formData.get('tipo') as string,
      assunto: formData.get('assunto') as string || null,
      proxima_acao: formData.get('proxima_acao') as string || null,
      data_proxima_acao: formData.get('data_proxima_acao') as string || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/clientes/${interacao.cliente_id}`)
  revalidatePath('/interacoes')
  redirect(`/clientes/${interacao.cliente_id}`)
}
