import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CarregamentoForm from '@/components/carregamentos/CarregamentoForm'

export default async function EditarCarregamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: c } = await supabase
    .from('carregamentos')
    .select('*, paradas(*, clientes(nome_propriedade))')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!c) notFound()

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

  type ParadaRaw = {
    ordem: number; cliente_id: string; produto: string | null; quantidade_kg: number | null
    quantidade_unidades: number | null; observacoes: string | null; pedido_id: string | null
    itens: Array<{ produto: string; quantidade_kg: number; quantidade_unidades?: number | null }> | null
  }
  const paradas = (c.paradas as ParadaRaw[])
    .sort((a, b) => a.ordem - b.ordem)
    .map(p => ({
      cliente_id: p.cliente_id,
      itens: Array.isArray(p.itens) && p.itens.length > 0
        ? p.itens.map(it => ({ produto: it.produto, quantidade_kg: it.quantidade_kg, quantidade_unidades: it.quantidade_unidades ?? null }))
        : [{ produto: p.produto ?? '', quantidade_kg: p.quantidade_kg ?? 0, quantidade_unidades: p.quantidade_unidades ?? null }],
      ordem: p.ordem,
      observacoes: p.observacoes || '',
      pedido_id: p.pedido_id ?? null,
    }))

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/carregamentos" className="text-gray-400 hover:text-gray-600 text-sm">Carregamentos</Link>
        <span className="text-gray-300">›</span>
        <Link href={`/carregamentos/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Detalhe</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Editar</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar carregamento</h1>
      <CarregamentoForm
        clientes={clientes ?? []}
        produtos={produtos ?? []}
        locais={locais ?? []}
        carregamento={{
          id: c.id,
          data: c.data,
          status: c.status,
          cliente_id: c.cliente_id ?? null,
          transportador_nome: c.transportador_nome,
          transportador_telefone: c.transportador_telefone,
          transportador_placa: c.transportador_placa,
          local_carregamento_id: c.local_carregamento_id,
          paradas,
        }}
      />
    </div>
  )
}
