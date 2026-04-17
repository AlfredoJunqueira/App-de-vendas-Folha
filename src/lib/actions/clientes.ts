'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarCliente(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('clientes').insert({
    nome_propriedade: formData.get('nome_propriedade') as string,
    contato: formData.get('contato') as string || null,
    telefone: formData.get('telefone') as string || null,
    cidade: formData.get('cidade') as string || null,
    estado: formData.get('estado') as string || null,
    tipo_animal: formData.get('tipo_animal') as string || null,
    num_cabecas: formData.get('num_cabecas') ? parseInt(formData.get('num_cabecas') as string) : null,
    produto_preferido: formData.get('produto_preferido') as string || null,
    volume_medio_ton: formData.get('volume_medio_ton') ? parseFloat((formData.get('volume_medio_ton') as string).replace(',', '.')) : null,
    status: formData.get('status') as string || 'prospecto',
    observacoes: formData.get('observacoes') as string || null,
    owner_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/clientes')
  revalidatePath('/dashboard')
  redirect('/clientes')
}

export async function atualizarCliente(id: string, _prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('clientes')
    .update({
      nome_propriedade: formData.get('nome_propriedade') as string,
      contato: formData.get('contato') as string || null,
      telefone: formData.get('telefone') as string || null,
      cidade: formData.get('cidade') as string || null,
      estado: formData.get('estado') as string || null,
      tipo_animal: formData.get('tipo_animal') as string || null,
      num_cabecas: formData.get('num_cabecas') ? parseInt(formData.get('num_cabecas') as string) : null,
      produto_preferido: formData.get('produto_preferido') as string || null,
      volume_medio_ton: formData.get('volume_medio_ton') ? parseFloat((formData.get('volume_medio_ton') as string).replace(',', '.')) : null,
      status: formData.get('status') as string,
      observacoes: formData.get('observacoes') as string || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/clientes/${id}`)
  revalidatePath('/clientes')
  revalidatePath('/dashboard')
  redirect(`/clientes/${id}`)
}

export async function excluirCliente(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Soft delete — apenas inativa o cliente
  const { error } = await supabase
    .from('clientes')
    .update({ status: 'inativo' })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/clientes')
  revalidatePath('/dashboard')
  redirect('/clientes')
}
