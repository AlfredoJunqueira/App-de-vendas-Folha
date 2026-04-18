'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function criarColaborador(formData: FormData): Promise<{ erro?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const email = (formData.get('email') as string)?.trim()
  const senha = formData.get('senha') as string

  if (!email || !senha || senha.length < 6) {
    return { erro: 'Email e senha (mínimo 6 caracteres) são obrigatórios' }
  }

  const admin = createAdminClient()

  const { data: novoUser, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (error || !novoUser.user) {
    if (error?.message?.includes('already registered')) return { erro: 'Este email já está cadastrado' }
    return { erro: error?.message ?? 'Erro ao criar colaborador' }
  }

  await admin.from('perfis').insert({
    user_id: novoUser.user.id,
    role: 'colaborador',
    employer_id: user.id,
  })

  revalidatePath('/configuracoes')
  return {}
}

export async function excluirColaborador(colaboradorId: string): Promise<{ erro?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { erro: 'Não autenticado' }

  const admin = createAdminClient()

  const { data: perfil } = await admin
    .from('perfis')
    .select('user_id')
    .eq('user_id', colaboradorId)
    .eq('employer_id', user.id)
    .eq('role', 'colaborador')
    .single()

  if (!perfil) return { erro: 'Colaborador não encontrado' }

  await admin.auth.admin.deleteUser(colaboradorId)

  revalidatePath('/configuracoes')
  return {}
}
