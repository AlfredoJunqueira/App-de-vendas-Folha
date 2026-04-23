import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatBRL, formatDate } from '@/lib/utils/format'
import PedidosBuscaInput from '@/components/pedidos/PedidosBuscaInput'

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mes?: string; busca?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const busca = params.busca?.trim() ?? ''

  const hoje = new Date()
  const mesAtual = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [ano, mes] = mesAtual.split('-').map(Number)
  const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]

  let query = supabase
    .from('pedidos')
    .select('*, clientes(nome_propriedade)')
    .eq('owner_id', user!.id)
    .order('criado_em', { ascending: false })

  if (busca) {
    // Busca global: sem filtro de mês, limita a 100 resultados
    query = query.limit(100)
  } else {
    query = query.gte('data_fechamento', inicioMes).lte('data_fechamento', fimMes)
  }

  if (params.status) query = query.eq('status', params.status)

  const [{ data: pedidosRaw }, { data: produtosDb }] = await Promise.all([
    query,
    supabase.from('produtos').select('value, label').eq('owner_id', user!.id),
  ])

  // Filtra pelo termo de busca no cliente ou produto
  const pedidos = busca
    ? (pedidosRaw ?? []).filter(p => {
        const nomeCliente = (p.clientes as { nome_propriedade: string } | null)?.nome_propriedade ?? ''
        return nomeCliente.toLowerCase().includes(busca.toLowerCase())
      })
    : (pedidosRaw ?? [])

  const produtoLabel: Record<string, string> = Object.fromEntries(
    (produtosDb ?? []).map(p => [p.value, p.label])
  )

  const totalTon = (pedidos?.reduce((s, p) => s + (p.quantidade_kg || 0), 0) ?? 0) / 1000
  const totalReceita = pedidos?.reduce((s, p) => s + (p.valor_total || 0), 0) ?? 0

  const statusLabel: Record<string, string> = {
    em_aberto: 'Em aberto',
    confirmado: 'Confirmado',
    aguardando_pesagem: 'Ag. pesagem',
    entregue: 'Entregue',
    aguardando_nf: 'Ag. NF',
    aguardando_boleto: 'Ag. Boleto',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
  }

  const statusColor: Record<string, string> = {
    em_aberto: 'bg-yellow-100 text-yellow-700',
    confirmado: 'bg-blue-100 text-blue-700',
    aguardando_pesagem: 'bg-orange-100 text-orange-700',
    entregue: 'bg-green-100 text-green-700',
    aguardando_nf: 'bg-violet-100 text-violet-700',
    aguardando_boleto: 'bg-purple-100 text-purple-700',
    finalizado: 'bg-teal-100 text-teal-700',
    cancelado: 'bg-gray-100 text-gray-500',
  }


  // Navegação entre meses
  const mesAnterior = new Date(ano, mes - 2, 1)
  const mesSeguinte = new Date(ano, mes, 1)
  const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
  const mesSeguinteStr = `${mesSeguinte.getFullYear()}-${String(mesSeguinte.getMonth() + 1).padStart(2, '0')}`
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pedidos</h1>
        <Link
          href="/pedidos/novo"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo pedido
        </Link>
      </div>

      {/* Barra de busca */}
      <PedidosBuscaInput initialValue={busca} />

      {busca ? (
        /* Modo busca: mostra resultados sem navegação de mês */
        <p className="text-sm text-gray-500">
          {pedidos.length} resultado{pedidos.length !== 1 ? 's' : ''} para &ldquo;{busca}&rdquo;
        </p>
      ) : (
        /* Navegação de mês + totais */
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <Link href={`/pedidos?mes=${mesAnteriorStr}`} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded">‹</Link>
              <span className="font-medium text-gray-900 capitalize">{nomeMes}</span>
              <Link href={`/pedidos?mes=${mesSeguinteStr}`} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded">›</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total toneladas</p>
                <p className="text-lg font-bold text-gray-900">{totalTon.toFixed(1)} t</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Receita total</p>
                <p className="text-lg font-bold text-gray-900">{formatBRL(totalReceita)}</p>
              </div>
            </div>
          </div>

          {/* Filtro por status */}
          <div className="flex gap-2 flex-wrap">
            {['', 'em_aberto', 'confirmado', 'aguardando_pesagem', 'entregue', 'aguardando_nf', 'aguardando_boleto', 'finalizado', 'cancelado'].map(s => (
              <Link
                key={s}
                href={`/pedidos?mes=${mesAtual}${s ? `&status=${s}` : ''}`}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  (params.status || '') === s
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s ? statusLabel[s] : 'Todos'}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Lista */}
      {pedidos.length > 0 ? (
        <div className="space-y-2">
          {pedidos.map(p => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  {(p as unknown as { numero: number | null }).numero != null && (
                    <span className="text-xs font-mono font-semibold text-gray-400 tabular-nums">
                      #{String((p as unknown as { numero: number }).numero).padStart(3, '0')}
                    </span>
                  )}
                  <p className="font-medium text-gray-900">
                    {(p.clientes as { nome_propriedade: string } | null)?.nome_propriedade}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {produtoLabel[p.produto]} — {p.quantidade_kg} kg
                </p>
                {p.data_fechamento && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.data_fechamento)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{formatBRL(p.valor_total)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[p.status]}`}>
                  {statusLabel[p.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">{busca ? 'Nenhum pedido encontrado' : 'Nenhum pedido neste mês'}</p>
          {!busca && (
            <Link href="/pedidos/novo" className="text-sm text-green-600 hover:underline mt-1 inline-block">
              Registrar pedido
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
