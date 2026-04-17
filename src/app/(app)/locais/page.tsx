import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LocaisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: locais } = await supabase
    .from('locais_carregamento')
    .select('*')
    .eq('owner_id', user!.id)
    .order('nome')

  const { data: produtosDb } = await supabase.from('produtos').select('value, label').eq('owner_id', user!.id)
  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  const ativos = locais?.filter(l => l.ativo) ?? []
  const inativos = locais?.filter(l => !l.ativo) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#193337]">Locais de Carregamento</h1>
        <Link
          href="/locais/novo"
          className="bg-[#193337] hover:bg-[#015046] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo local
        </Link>
      </div>

      {ativos.length === 0 && inativos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-500 text-sm">Nenhum local cadastrado ainda.</p>
          <Link
            href="/locais/novo"
            className="mt-4 inline-block text-sm text-[#015046] font-medium hover:underline"
          >
            Cadastrar o primeiro local
          </Link>
        </div>
      ) : (
        <>
          {/* Locais ativos */}
          {ativos.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {ativos.map(local => (
                <Link
                  key={local.id}
                  href={`/locais/${local.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#015046] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#193337] group-hover:text-[#015046] truncate">
                        {local.nome}
                      </p>
                      {(local.cidade || local.estado) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[local.cidade, local.estado].filter(Boolean).join(' — ')}
                        </p>
                      )}
                    </div>
                    {local.produto && (
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-[#EAF5F5] text-[#015046]">
                        {produtoLabel[local.produto]}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1">
                    {local.responsavel && (
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-400">Responsável:</span> {local.responsavel}
                      </p>
                    )}
                    {local.telefone && (
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-400">Telefone:</span> {local.telefone}
                      </p>
                    )}
                    {local.endereco && (
                      <p className="text-sm text-gray-500 truncate">{local.endereco}</p>
                    )}
                    {local.capacidade_ton && (
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-400">Capacidade:</span>{' '}
                        <span className="font-medium text-[#193337]">{local.capacidade_ton} t</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Locais inativos */}
          {inativos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Inativos ({inativos.length})
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {inativos.map(local => (
                  <Link
                    key={local.id}
                    href={`/locais/${local.id}`}
                    className="bg-white rounded-xl border border-gray-100 p-4 opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <p className="font-medium text-gray-600">{local.nome}</p>
                    {(local.cidade || local.estado) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[local.cidade, local.estado].filter(Boolean).join(' — ')}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
