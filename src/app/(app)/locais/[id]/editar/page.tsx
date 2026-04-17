import { createClient } from '@/lib/supabase/server'
import LocalForm from '@/components/locais/LocalForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditarLocalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: local } = await supabase
    .from('locais_carregamento')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!local) notFound()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('value, label')
    .eq('owner_id', user!.id)
    .eq('ativo', true)
    .order('ordem')

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/locais/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {local.nome}
        </Link>
        <h1 className="text-xl font-semibold text-[#193337]">Editar Local</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <LocalForm local={local} produtos={produtos ?? []} />
      </div>
    </div>
  )
}
