import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { toggleProdutoAtivo, excluirProduto } from '@/lib/actions/produtos'

export default async function ProdutosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('owner_id', user!.id)
    .order('ordem')
    .order('label')

  const ativos = produtos?.filter(p => p.ativo) ?? []
  const inativos = produtos?.filter(p => !p.ativo) ?? []

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#193337]">Produtos</h1>
        <Link
          href="/produtos/novo"
          className="bg-[#193337] hover:bg-[#015046] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo produto
        </Link>
      </div>

      {produtos?.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Nenhum produto cadastrado.</p>
          <Link href="/produtos/novo" className="text-[#015046] text-sm font-medium hover:underline">
            Cadastrar primeiro produto →
          </Link>
        </div>
      )}

      {ativos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide text-xs">Ativos</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {ativos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{p.label}</p>
                  <p className="text-xs text-gray-400">Abrev.: {p.curto} · ID: {p.value}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/produtos/${p.id}/editar`}
                    className="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-50 rounded text-gray-600"
                  >
                    Editar
                  </Link>
                  <form action={toggleProdutoAtivo.bind(null, p.id, false)}>
                    <button type="submit" className="text-xs px-2 py-1 border border-gray-300 hover:bg-gray-50 rounded text-gray-500">
                      Desativar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inativos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-70">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-xs">Inativos</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {inativos.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{p.label}</p>
                  <p className="text-xs text-gray-400">Abrev.: {p.curto} · ID: {p.value}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={toggleProdutoAtivo.bind(null, p.id, true)}>
                    <button type="submit" className="text-xs px-2 py-1 border border-green-300 hover:bg-green-50 rounded text-green-700">
                      Reativar
                    </button>
                  </form>
                  <form action={excluirProduto.bind(null, p.id)}>
                    <button type="submit" className="text-xs px-2 py-1 border border-red-200 hover:bg-red-50 rounded text-red-500">
                      Apagar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center px-4">
        Produtos inativos não aparecem nos formulários, mas os registros existentes permanecem intactos.
      </p>
    </div>
  )
}
