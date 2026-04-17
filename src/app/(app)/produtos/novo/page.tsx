import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { criarProduto } from '@/lib/actions/produtos'

export default async function NovoProdutoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: existentes } = await supabase
    .from('produtos')
    .select('ordem')
    .eq('owner_id', user!.id)
    .order('ordem', { ascending: false })
    .limit(1)

  const proximaOrdem = existentes?.[0] ? existentes[0].ordem + 1 : 1

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/produtos" className="text-gray-400 hover:text-gray-600 text-sm">Produtos</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Novo produto</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Novo produto</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={criarProduto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="label"
              type="text"
              required
              placeholder="Ex: Feno tifton"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Exibido nos formulários de pedidos e carregamentos.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abreviação <span className="text-red-500">*</span>
            </label>
            <input
              name="curto"
              type="text"
              required
              maxLength={10}
              placeholder="Ex: Feno"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Versão curta exibida nos cards do calendário.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
            <input
              name="ordem"
              type="number"
              min="0"
              defaultValue={proximaOrdem}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de embalagem</label>
              <input
                name="unidade_embalagem"
                type="text"
                placeholder="Ex: fardo, bola, saco"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso por unidade (kg)</label>
              <input
                name="peso_unitario_kg"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Usado para calcular quantidade de fardos/bolas nos cards do calendário.</p>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-2.5 bg-[#193337] hover:bg-[#015046] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar produto
            </button>
            <Link
              href="/produtos"
              className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
