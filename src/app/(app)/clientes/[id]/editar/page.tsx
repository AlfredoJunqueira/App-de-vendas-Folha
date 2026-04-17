import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClienteForm from '@/components/clientes/ClienteForm'

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!cliente) notFound()

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
        <Link href={`/clientes/${id}`} className="text-gray-400 hover:text-gray-600 text-sm truncate max-w-[150px]">
          {cliente.nome_propriedade}
        </Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Editar</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar cliente</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClienteForm cliente={cliente} produtos={produtos ?? []} />
      </div>
    </div>
  )
}
