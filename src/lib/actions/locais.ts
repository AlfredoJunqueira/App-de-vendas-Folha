'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function criarLocal(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const base = {
    nome: formData.get('nome') as string,
    responsavel: formData.get('responsavel') as string || null,
    telefone: formData.get('telefone') as string || null,
    cidade: formData.get('cidade') as string || null,
    estado: formData.get('estado') as string || null,
    endereco: formData.get('endereco') as string || null,
    produto: formData.get('produto') as string || null,
    capacidade_ton: formData.get('capacidade_ton')
      ? parseFloat((formData.get('capacidade_ton') as string).replace(',', '.'))
      : null,
    observacoes: formData.get('observacoes') as string || null,
    ativo: true,
    owner_id: user.id,
  }
  const corFonte = formData.get('cor_fonte') as string || null
  const ins1 = await supabase.from('locais_carregamento').insert(corFonte ? { ...base, cor_fonte: corFonte } : base)
  const error = ins1.error?.message?.includes('cor_fonte')
    ? (await supabase.from('locais_carregamento').insert(base)).error
    : ins1.error

  if (error) throw new Error(error.message)

  revalidatePath('/locais')
  redirect('/locais')
}

export async function atualizarLocal(id: string, _prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const baseUpd = {
    nome: formData.get('nome') as string,
    responsavel: formData.get('responsavel') as string || null,
    telefone: formData.get('telefone') as string || null,
    cidade: formData.get('cidade') as string || null,
    estado: formData.get('estado') as string || null,
    endereco: formData.get('endereco') as string || null,
    produto: formData.get('produto') as string || null,
    capacidade_ton: formData.get('capacidade_ton')
      ? parseFloat((formData.get('capacidade_ton') as string).replace(',', '.'))
      : null,
    observacoes: formData.get('observacoes') as string || null,
    ativo: formData.get('ativo') === 'true',
  }
  const corFonteUpd = formData.get('cor_fonte') as string || null
  const upd1 = await supabase
    .from('locais_carregamento')
    .update(corFonteUpd ? { ...baseUpd, cor_fonte: corFonteUpd } : baseUpd)
    .eq('id', id)
    .eq('owner_id', user.id)
  const error = upd1.error?.message?.includes('cor_fonte')
    ? (await supabase.from('locais_carregamento').update(baseUpd).eq('id', id).eq('owner_id', user.id)).error
    : upd1.error

  if (error) throw new Error(error.message)

  revalidatePath('/locais')
  revalidatePath(`/locais/${id}`)
  redirect(`/locais/${id}`)
}

export async function excluirLocal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('locais_carregamento')
    .update({ ativo: false })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/locais')
  redirect('/locais')
}
