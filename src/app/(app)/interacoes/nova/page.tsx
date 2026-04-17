import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { criarInteracao } from '@/lib/actions/interacoes'

export default async function NovaInteracaoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome_propriedade')
    .eq('owner_id', user!.id)
    .neq('status', 'inativo')
    .order('nome_propriedade')

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/interacoes" className="text-gray-400 hover:text-gray-600 text-sm">Agenda</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Nova interação</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Registrar interação</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={criarInteracao} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              name="cliente_id"
              required
              defaultValue={params.cliente_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecionar cliente</option>
              {clientes?.map(c => (
                <option key={c.id} value={c.id}>{c.nome_propriedade}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="data"
                required
                defaultValue={hoje}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Enviar proposta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data prevista</label>
              <input
                type="date"
                name="data_proxima_acao"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar interação
            </button>
            <Link
              href="/interacoes"
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
