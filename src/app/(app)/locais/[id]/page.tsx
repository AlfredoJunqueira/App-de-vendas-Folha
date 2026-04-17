import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { excluirLocal } from '@/lib/actions/locais'

export default async function LocalPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: produtosDb } = await supabase.from('produtos').select('value, label').eq('owner_id', user!.id)
  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  const excluirComId = excluirLocal.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/locais" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">
            ← Locais
          </Link>
          <h1 className="text-xl font-semibold text-[#193337] truncate">{local.nome}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/locais/${id}/editar`}
            className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Status */}
      {!local.ativo && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-500">
          Este local está <strong>inativo</strong>.
        </div>
      )}

      {/* Dados */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {local.produto && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-500">Produto</span>
            <span className="text-sm font-medium text-gray-900">{produtoLabel[local.produto]}</span>
          </div>
        )}
        {local.capacidade_ton && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-500">Capacidade estimada</span>
            <span className="text-sm font-semibold text-[#193337]">{local.capacidade_ton} t</span>
          </div>
        )}
        {local.responsavel && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-500">Responsável</span>
            <span className="text-sm font-medium text-gray-900">{local.responsavel}</span>
          </div>
        )}
        {local.telefone && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-500">Telefone</span>
            <a
              href={`tel:${local.telefone}`}
              className="text-sm font-medium text-[#015046] hover:underline"
            >
              {local.telefone}
            </a>
          </div>
        )}
        {local.endereco && (
          <div className="flex items-start justify-between px-5 py-3 gap-4">
            <span className="text-sm text-gray-500 shrink-0">Endereço</span>
            <span className="text-sm text-gray-900 text-right">{local.endereco}</span>
          </div>
        )}
        {(local.cidade || local.estado) && (
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-gray-500">Localização</span>
            <span className="text-sm font-medium text-gray-900">
              {[local.cidade, local.estado].filter(Boolean).join(' — ')}
            </span>
          </div>
        )}
        {local.observacoes && (
          <div className="px-5 py-3">
            <p className="text-sm text-gray-500 mb-1">Observações</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{local.observacoes}</p>
          </div>
        )}
      </div>

      {/* Desativar */}
      {local.ativo && (
        <form action={excluirComId}>
          <button
            type="submit"
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Desativar este local
          </button>
        </form>
      )}
    </div>
  )
}
