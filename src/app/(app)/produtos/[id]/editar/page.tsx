import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { atualizarProduto } from '@/lib/actions/produtos'

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: produto } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!produto) notFound()

  const action = atualizarProduto.bind(null, id)

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/produtos" className="text-gray-400 hover:text-gray-600 text-sm">Produtos</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Editar</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar produto</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID interno</label>
            <input
              type="text"
              value={produto.value}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O ID não pode ser alterado pois é usado nos registros existentes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              name="label"
              type="text"
              required
              defaultValue={produto.label}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
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
              defaultValue={produto.curto}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
            <input
              name="ordem"
              type="number"
              min="0"
              defaultValue={produto.ordem}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de embalagem</label>
              <input
                name="unidade_embalagem"
                type="text"
                defaultValue={produto.unidade_embalagem ?? ''}
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
                defaultValue={produto.peso_unitario_kg ?? ''}
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
              Salvar alterações
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
