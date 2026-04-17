import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { atualizarInteracao } from '@/lib/actions/interacoes'

export default async function EditarInteracaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: i } = await supabase
    .from('interacoes')
    .select('*, clientes(nome_propriedade)')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!i) notFound()

  const action = atualizarInteracao.bind(null, id)
  const cliente = i.clientes as { nome_propriedade: string } | null

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/interacoes" className="text-gray-400 hover:text-gray-600 text-sm">Agenda</Link>
        <span className="text-gray-300">›</span>
        <Link href={`/clientes/${i.cliente_id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          {cliente?.nome_propriedade}
        </Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Editar interação</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar interação</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="data"
                required
                defaultValue={i.data}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo"
                required
                defaultValue={i.tipo}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="visita">Visita presencial</option>
                <option value="ligacao">Ligação</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assunto / Resumo</label>
            <textarea
              name="assunto"
              rows={3}
              defaultValue={i.assunto ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="O que foi tratado nessa interação..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima ação</label>
              <input
                type="text"
                name="proxima_acao"
                defaultValue={i.proxima_acao ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Enviar proposta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data prevista</label>
              <input
                type="date"
                name="data_proxima_acao"
                defaultValue={i.data_proxima_acao ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar alterações
            </button>
            <Link
              href={`/clientes/${i.cliente_id}`}
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
