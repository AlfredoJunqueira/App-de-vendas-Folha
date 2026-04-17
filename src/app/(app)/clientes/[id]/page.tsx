import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatBRL } from '@/lib/utils/format'
import { excluirCliente } from '@/lib/actions/clientes'

const tipoLabel: Record<string, string> = { visita: 'Visita', ligacao: 'Ligação', whatsapp: 'WhatsApp', email: 'E-mail' }
const animalLabel: Record<string, string> = { bovino: 'Bovino', equino: 'Equino', ambos: 'Ambos' }
const statusPedidoLabel: Record<string, string> = { em_aberto: 'Em aberto', confirmado: 'Confirmado', entregue: 'Entregue', cancelado: 'Cancelado' }
const statusPedidoColor: Record<string, string> = {
  em_aberto: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-blue-100 text-blue-700',
  entregue: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-500',
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!cliente) notFound()

  const { data: produtosDb } = await supabase.from('produtos').select('value, label').eq('owner_id', user!.id)
  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  const { data: interacoes } = await supabase
    .from('interacoes')
    .select('*')
    .eq('cliente_id', id)
    .order('data', { ascending: false })
    .limit(20)

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .eq('cliente_id', id)
    .order('criado_em', { ascending: false })
    .limit(10)

  const excluirAction = excluirCliente.bind(null, id)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="text-gray-400 hover:text-gray-600 text-sm">Clientes</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600 truncate">{cliente.nome_propriedade}</span>
      </div>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{cliente.nome_propriedade}</h1>
            <p className="text-gray-500 mt-0.5">{cliente.contato}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/clientes/${id}/editar`}
              className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-sm rounded-lg transition-colors"
            >
              Editar
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          {cliente.telefone && (
            <div>
              <p className="text-xs text-gray-400">Telefone</p>
              <p className="text-sm font-medium">{cliente.telefone}</p>
            </div>
          )}
          {(cliente.cidade || cliente.estado) && (
            <div>
              <p className="text-xs text-gray-400">Localização</p>
              <p className="text-sm font-medium">{[cliente.cidade, cliente.estado].filter(Boolean).join('/')}</p>
            </div>
          )}
          {cliente.tipo_animal && (
            <div>
              <p className="text-xs text-gray-400">Animais</p>
              <p className="text-sm font-medium">{animalLabel[cliente.tipo_animal]}</p>
            </div>
          )}
          {cliente.num_cabecas && (
            <div>
              <p className="text-xs text-gray-400">Nº de cabeças</p>
              <p className="text-sm font-medium">{cliente.num_cabecas.toLocaleString('pt-BR')}</p>
            </div>
          )}
          {cliente.produto_preferido && (
            <div>
              <p className="text-xs text-gray-400">Produto preferido</p>
              <p className="text-sm font-medium">{produtoLabel[cliente.produto_preferido]}</p>
            </div>
          )}
          {cliente.volume_medio_ton && (
            <div>
              <p className="text-xs text-gray-400">Volume médio/mês</p>
              <p className="text-sm font-medium">{cliente.volume_medio_ton} t</p>
            </div>
          )}
        </div>

        {cliente.observacoes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Observações</p>
            <p className="text-sm text-gray-700">{cliente.observacoes}</p>
          </div>
        )}
      </div>

      {/* Histórico de interações */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Histórico de interações</h2>
          <Link
            href={`/interacoes/nova?cliente_id=${id}`}
            className="text-sm text-green-600 hover:underline"
          >
            + Registrar
          </Link>
        </div>
        {interacoes && interacoes.length > 0 ? (
          <div className="space-y-3">
            {interacoes.map(i => (
              <div key={i.id} className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      {tipoLabel[i.tipo]}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(i.data)}</span>
                  </div>
                  {i.assunto && <p className="text-sm text-gray-700 mt-1">{i.assunto}</p>}
                  {i.proxima_acao && (
                    <p className="text-xs text-gray-500 mt-1">
                      Próxima ação: {i.proxima_acao}
                      {i.data_proxima_acao && ` — ${formatDate(i.data_proxima_acao)}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma interação registrada</p>
        )}
      </div>

      {/* Pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Pedidos</h2>
          <Link href={`/pedidos/novo?cliente_id=${id}`} className="text-sm text-green-600 hover:underline">
            + Novo pedido
          </Link>
        </div>
        {pedidos && pedidos.length > 0 ? (
          <div className="space-y-2">
            {pedidos.map(p => (
              <Link
                key={p.id}
                href={`/pedidos/${p.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{produtoLabel[p.produto]} — {p.quantidade_kg} kg</p>
                  <p className="text-xs text-gray-500">{p.data_fechamento ? formatDate(p.data_fechamento) : '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatBRL(p.valor_total)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusPedidoColor[p.status]}`}>
                    {statusPedidoLabel[p.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum pedido registrado</p>
        )}
      </div>
    </div>
  )
}
