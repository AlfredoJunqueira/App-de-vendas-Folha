import { createClient } from '@/lib/supabase/server'
import ClienteForm from '@/components/clientes/ClienteForm'
import Link from 'next/link'

export default async function NovoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('value, label')
    .eq('owner_id', user!.id)
    .eq('ativo', true)
    .order('ordem')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/clientes" className="text-gray-400 hover:text-gray-600 text-sm">Clientes</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Novo cliente</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Novo cliente</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClienteForm produtos={produtos ?? []} />
      </div>
    </div>
  )
}
