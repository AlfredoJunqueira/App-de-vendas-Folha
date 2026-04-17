import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CarregamentoForm from '@/components/carregamentos/CarregamentoForm'

export default async function NovoCarregamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: clientes }, { data: produtos }, { data: locais }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nome_propriedade, contato')
      .eq('owner_id', user!.id)
      .neq('status', 'inativo')
      .order('nome_propriedade'),
    supabase
      .from('produtos')
      .select('value, label')
      .eq('owner_id', user!.id)
      .eq('ativo', true)
      .order('ordem'),
    supabase
      .from('locais_carregamento')
      .select('id, nome, cidade, estado')
      .eq('owner_id', user!.id)
      .order('nome'),
  ])

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/carregamentos" className="text-gray-400 hover:text-gray-600 text-sm">Carregamentos</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Novo</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Novo carregamento</h1>
      <CarregamentoForm clientes={clientes ?? []} produtos={produtos ?? []} locais={locais ?? []} />
    </div>
  )
}
