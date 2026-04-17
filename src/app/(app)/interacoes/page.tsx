import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'

export default async function InteracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; mes?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = new Date()
  const limite30dias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Próximas ações agendadas
  const { data: proximasAcoes } = await supabase
    .from('interacoes')
    .select('*, clientes(nome_propriedade)')
    .eq('owner_id', user!.id)
    .not('data_proxima_acao', 'is', null)
    .gte('data_proxima_acao', hoje.toISOString().split('T')[0])
    .order('data_proxima_acao')
    .limit(20)

  // Clientes ativos sem contato há mais de 30 dias
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, nome_propriedade, contato')
    .eq('owner_id', user!.id)
    .eq('status', 'ativo')

  const { data: interacoesRecentes } = await supabase
    .from('interacoes')
    .select('cliente_id, data')
    .eq('owner_id', user!.id)
    .gte('data', limite30dias)

  const clientesComContato = new Set(interacoesRecentes?.map(i => i.cliente_id))
  const alertas = clientes?.filter(c => !clientesComContato.has(c.id)) ?? []

  // Histórico recente
  const { data: historico } = await supabase
    .from('interacoes')
    .select('*, clientes(nome_propriedade)')
    .eq('owner_id', user!.id)
    .order('data', { ascending: false })
    .limit(30)

  const tipoLabel: Record<string, string> = {
    visita: 'Visita',
    ligacao: 'Ligação',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
  }

  const tipoColor: Record<string, string> = {
    visita: 'bg-green-100 text-green-700',
    ligacao: 'bg-blue-100 text-blue-700',
    whatsapp: 'bg-emerald-100 text-emerald-700',
    email: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Agenda de Visitas</h1>
        <Link
          href="/interacoes/nova"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Registrar interação
        </Link>
      </div>

      {/* Alertas — clientes sem contato */}
      {alertas.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h2 className="font-medium text-orange-800 mb-3">
            ⚠️ Clientes sem contato há mais de 30 dias ({alertas.length})
          </h2>
          <div className="space-y-2">
            {alertas.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg"
              >
                <Link href={`/clientes/${c.id}`} className="flex-1 hover:opacity-75 transition-opacity">
                  <p className="text-sm font-medium text-gray-900">{c.nome_propriedade}</p>
                  <p className="text-xs text-gray-500">{c.contato}</p>
                </Link>
                <Link
                  href={`/interacoes/nova?cliente_id=${c.id}`}
                  className="text-xs text-orange-600 hover:underline px-2 py-1 border border-orange-200 rounded-md"
                >
                  Registrar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximas ações */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-4">Próximas ações agendadas</h2>
          {proximasAcoes && proximasAcoes.length > 0 ? (
            <div className="space-y-3">
              {proximasAcoes.map(i => (
                <Link
                  key={i.id}
                  href={`/clientes/${i.cliente_id}`}
                  className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {(i.clientes as { nome_propriedade: string } | null)?.nome_propriedade}
                    </p>
                    <span className="text-xs text-gray-500">{formatDate(i.data_proxima_acao!)}</span>
                  </div>
                  <p className="text-xs text-gray-600">{i.proxima_acao}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">Nenhuma ação agendada</p>
          )}
        </div>

        {/* Histórico recente */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-4">Histórico recente</h2>
          {historico && historico.length > 0 ? (
            <div className="space-y-2">
              {historico.map(i => (
                <Link
                  key={i.id}
                  href={`/clientes/${i.cliente_id}`}
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${tipoColor[i.tipo]}`}>
                    {tipoLabel[i.tipo]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {(i.clientes as { nome_propriedade: string } | null)?.nome_propriedade}
                    </p>
                    {i.assunto && <p className="text-xs text-gray-500 truncate">{i.assunto}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDate(i.data)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">Nenhuma interação registrada</p>
          )}
        </div>
      </div>
    </div>
  )
}
