import { createClient } from '@/lib/supabase/server'
import { formatBRL, formatTon, formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import BannerPlanejamento from '@/components/planejamento/BannerPlanejamento'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const labelMesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje)

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
  const proximos7 = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const hoje_str = hoje.toISOString().split('T')[0]
  const limite30dias = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Pedidos do mês (entregues ou confirmados)
  const { data: pedidosMes } = await supabase
    .from('pedidos')
    .select('quantidade_kg, valor_total, cliente_id, status')
    .eq('owner_id', user!.id)
    .gte('data_fechamento', inicioMes)
    .lte('data_fechamento', fimMes)
    .neq('status', 'cancelado')

  const totalToneladas = (pedidosMes?.reduce((s, p) => s + (p.quantidade_kg || 0), 0) ?? 0) / 1000
  const totalReceita = pedidosMes?.reduce((s, p) => s + (p.valor_total || 0), 0) ?? 0
  const pedidosAtivos = pedidosMes?.filter(p => p.status === 'em_aberto' || p.status === 'confirmado').length ?? 0
  const clientesAtendidos = new Set(pedidosMes?.map(p => p.cliente_id)).size

  // Carregamentos próximos 7 dias
  const { data: carregamentosProximos } = await supabase
    .from('carregamentos')
    .select('id, data, transportador_nome, status')
    .eq('owner_id', user!.id)
    .gte('data', hoje_str)
    .lte('data', proximos7)
    .order('data')

  // Clientes sem contato há mais de 30 dias
  const { data: todosClientes } = await supabase
    .from('clientes')
    .select('id, nome_propriedade, contato')
    .eq('owner_id', user!.id)
    .eq('status', 'ativo')

  const { data: interacoesRecentes } = await supabase
    .from('interacoes')
    .select('cliente_id, data')
    .eq('owner_id', user!.id)
    .gte('data', limite30dias)

  const clientesComContatoRecente = new Set(interacoesRecentes?.map(i => i.cliente_id))
  const clientesSemContato = todosClientes?.filter(c => !clientesComContatoRecente.has(c.id)) ?? []

  // Verifica se já existe planejamento salvo para o mês atual
  const { data: planejamentoDoMes } = await supabase
    .from('planejamentos_mensais')
    .select('id')
    .eq('owner_id', user!.id)
    .eq('mes', mesAtualStr)
    .limit(1)
  const temPlanejamentoSalvo = (planejamentoDoMes?.length ?? 0) > 0

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    em_rota: 'Em rota',
    entregue: 'Entregue',
  }

  const statusColor: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-600',
    confirmado: 'bg-blue-100 text-blue-700',
    em_rota: 'bg-yellow-100 text-yellow-700',
    entregue: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6">
      <BannerPlanejamento
        mesAtual={mesAtualStr}
        labelMes={labelMesAtual}
        temPlanejamentoSalvo={temPlanejamentoSalvo}
      />

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Toneladas no mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalToneladas.toFixed(1)} t</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Receita no mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatBRL(totalReceita)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pedidos ativos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pedidosAtivos}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Clientes atendidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{clientesAtendidos}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Carregamentos próximos 7 dias */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Próximos carregamentos</h2>
            <Link href="/carregamentos" className="text-xs text-green-600 hover:underline">Ver todos</Link>
          </div>
          {carregamentosProximos && carregamentosProximos.length > 0 ? (
            <div className="space-y-2">
              {carregamentosProximos.map(c => (
                <Link
                  key={c.id}
                  href={`/carregamentos/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(c.data)}</p>
                    <p className="text-xs text-gray-500">{c.transportador_nome || 'Sem transportador'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status]}`}>
                    {statusLabel[c.status]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">Nenhum carregamento nos próximos 7 dias</p>
          )}
        </div>

        {/* Clientes sem contato */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">
              Clientes sem contato
              {clientesSemContato.length > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                  {clientesSemContato.length}
                </span>
              )}
            </h2>
            <Link href="/clientes" className="text-xs text-green-600 hover:underline">Ver clientes</Link>
          </div>
          {clientesSemContato.length > 0 ? (
            <div className="space-y-2">
              {clientesSemContato.slice(0, 5).map(c => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <span className="text-orange-500">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.nome_propriedade}</p>
                    <p className="text-xs text-gray-500">{c.contato}</p>
                  </div>
                </Link>
              ))}
              {clientesSemContato.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{clientesSemContato.length - 5} outros clientes
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">Todos os clientes foram contactados nos últimos 30 dias</p>
          )}
        </div>
      </div>
    </div>
  )
}
