'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type DadosMeta = {
  clienteId: string
  produto: string
  unidade: string
  metaVolume: number
  mediaHistorica: number
  tipoMix: 'principal' | 'ocasional'
}

export async function salvarPlanejamento(mes: string, dados: DadosMeta[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const records = dados.map(d => ({
    mes,
    cliente_id: d.clienteId,
    produto: d.produto,
    unidade: d.unidade,
    meta_volume: d.metaVolume,
    media_historica: d.mediaHistorica,
    tipo_mix: d.tipoMix,
    atualizado_em: new Date().toISOString(),
    owner_id: user.id,
  }))

  const { error } = await supabase
    .from('planejamentos_mensais')
    .upsert(records, { onConflict: 'owner_id,mes,cliente_id,produto' })

  if (error) throw new Error(error.message)

  revalidatePath('/planejamento')
  revalidatePath('/dashboard')
}
