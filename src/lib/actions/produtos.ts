'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export async function criarProduto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const label = formData.get('label') as string
  const curto = formData.get('curto') as string
  const value = slugify(label)

  const pesoUnitario = formData.get('peso_unitario_kg')
  const unidadeEmbalagem = formData.get('unidade_embalagem') as string

  const { error } = await supabase.from('produtos').insert({
    owner_id: user.id,
    value,
    label,
    curto,
    ativo: true,
    ordem: Number(formData.get('ordem') || 0),
    peso_unitario_kg: pesoUnitario ? Number(pesoUnitario) : null,
    unidade_embalagem: unidadeEmbalagem || null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/produtos')
  redirect('/produtos')
}

export async function atualizarProduto(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pesoUnitario = formData.get('peso_unitario_kg')
  const unidadeEmbalagem = formData.get('unidade_embalagem') as string

  const { error } = await supabase
    .from('produtos')
    .update({
      label: formData.get('label') as string,
      curto: formData.get('curto') as string,
      ordem: Number(formData.get('ordem') || 0),
      peso_unitario_kg: pesoUnitario ? Number(pesoUnitario) : null,
      unidade_embalagem: unidadeEmbalagem || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/produtos')
  redirect('/produtos')
}

export async function toggleProdutoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('produtos')
    .update({ ativo })
    .eq('id', id)
    .eq('owner_id', user.id)

  revalidatePath('/produtos')
}

export async function excluirProduto(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('produtos').delete().eq('id', id).eq('owner_id', user.id)

  revalidatePath('/produtos')
  redirect('/produtos')
}
