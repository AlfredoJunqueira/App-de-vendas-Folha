'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function salvarIdentidade(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nomeApp      = (formData.get('nome_app')      as string) || null
  const subtituloApp = (formData.get('subtitulo_app') as string) || null

  let logoUrl: string | undefined

  const file = formData.get('logo') as File | null
  if (file && file.size > 0) {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${user.id}/logo.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path)
    logoUrl = urlData.publicUrl
  }

  const update: Record<string, unknown> = {
    user_id: user.id,
    nome_app: nomeApp,
    subtitulo_app: subtituloApp,
  }
  if (logoUrl !== undefined) update.logo_url = logoUrl

  const { error } = await supabase
    .from('perfis')
    .upsert(update, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  redirect('/configuracoes')
}

export async function removerLogo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('perfis')
    .upsert({ user_id: user.id, logo_url: null }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/', 'layout')
  redirect('/configuracoes')
}

export async function salvarPerfil(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('perfis')
    .upsert({
      user_id:            user.id,
      nome:               (formData.get('nome')               as string) || null,
      empresa:            (formData.get('empresa')            as string) || null,
      telefone:           (formData.get('telefone')           as string) || null,
      email:              (formData.get('email')              as string) || null,
      cnpj:               (formData.get('cnpj')               as string) || null,
      inscricao_estadual: (formData.get('inscricao_estadual') as string) || null,
      endereco:           (formData.get('endereco')           as string) || null,
      cidade:             (formData.get('cidade')             as string) || null,
      estado:             (formData.get('estado')             as string) || null,
      cep:                (formData.get('cep')                as string) || null,
    }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/configuracoes')
  redirect('/configuracoes')
}
