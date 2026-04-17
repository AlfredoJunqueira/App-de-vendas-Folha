import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'
import DeleteCarregamentoButton from '@/components/carregamentos/DeleteCarregamentoButton'
import { criarPedidoDaParada } from '@/lib/actions/carregamentos'

export default async function CarregamentoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: c }, { data: produtosDb }, { data: pedidosDoCarregamento }] = await Promise.all([
    supabase
      .from('carregamentos')
      .select('*, paradas(*, clientes(nome_propriedade, cidade, estado))')
      .eq('id', id)
      .eq('owner_id', user!.id)
      .single(),
    supabase.from('produtos').select('value, label').eq('owner_id', user!.id),
    supabase.from('pedidos').select('id, cliente_id').eq('carregamento_id', id).eq('owner_id', user!.id),
  ])

  if (!c) notFound()

  // Busca cliente do carregamento (campo adicionado na migration 013 — pode não existir ainda)
  let clienteDoCarregamento: { nome_propriedade: string; contato: string | null } | null = null
  const clienteId = (c as Record<string, unknown>).cliente_id as string | null | undefined
  if (clienteId) {
    const { data: cli } = await supabase
      .from('clientes')
      .select('nome_propriedade, contato')
      .eq('id', clienteId)
      .single()
    clienteDoCarregamento = cli ?? null
  }

  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  type ParadaItem = { produto: string; quantidade_kg: number; quantidade_unidades?: number | null }
  const paradas = (c.paradas as {
    id: string
    ordem: number
    cliente_id: string
    produto: string | null
    quantidade_kg: number | null
    itens: ParadaItem[] | null
    pedido_id: string | null
    observacoes: string | null
    clientes: { nome_propriedade: string; cidade: string | null; estado: string | null } | null
  }[]).sort((a, b) => a.ordem - b.ordem)

  // Fallback: paradas antigas sem pedido_id — encontra pedido pelo cliente_id
  const pedidoPorCliente = new Map<string, string>()
  ;(pedidosDoCarregamento ?? []).forEach(p => pedidoPorCliente.set(p.cliente_id, p.id))

  const totalKg = paradas.reduce((s, p) => {
    if (Array.isArray(p.itens) && p.itens.length > 0) {
      return s + p.itens.reduce((si, it) => si + (it.quantidade_kg || 0), 0)
    }
    return s + (p.quantidade_kg || 0)
  }, 0)

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    em_rota: 'Em rota',
    entregue: 'Entregue',
  }

  const statusColor: Record<string, string> = {
    rascunho: 'bg-gray-100 text-gray-700',
    confirmado: 'bg-blue-100 text-blue-700',
    em_rota: 'bg-yellow-100 text-yellow-700',
    entregue: 'bg-green-100 text-green-700',
  }

  const linkPublico = `/c/${c.link_publico_token}`

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/carregamentos" className="text-gray-400 hover:text-gray-600 text-sm">Carregamentos</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">{formatDate(c.data)}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{formatDate(c.data)}</h1>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status]}`}>
              {statusLabel[c.status]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/carregamentos/${id}/editar`} className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-sm rounded-lg">
              Editar
            </Link>
            <DeleteCarregamentoButton id={id} mes={c.data?.slice(0, 7)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
          {clienteDoCarregamento && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Cliente</p>
              <p className="text-sm font-medium">
                {clienteDoCarregamento.nome_propriedade}
                {clienteDoCarregamento.contato && (
                  <span className="text-gray-400 font-normal"> — {clienteDoCarregamento.contato}</span>
                )}
              </p>
            </div>
          )}
          {c.transportador_nome && (
            <div>
              <p className="text-xs text-gray-400">Transportador</p>
              <p className="text-sm font-medium">{c.transportador_nome}</p>
            </div>
          )}
          {c.transportador_placa && (
            <div>
              <p className="text-xs text-gray-400">Placa</p>
              <p className="text-sm font-medium">{c.transportador_placa}</p>
            </div>
          )}
          {c.transportador_telefone && (
            <div>
              <p className="text-xs text-gray-400">Telefone</p>
              <p className="text-sm font-medium">{c.transportador_telefone}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Total carregado</p>
            <p className="text-sm font-medium">{totalKg.toLocaleString('pt-BR')} kg</p>
          </div>
        </div>
      </div>

      {/* Paradas */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-medium text-gray-900 mb-4">Paradas ({paradas.length})</h2>
        {paradas.length > 0 ? (
          <div className="space-y-3">
            {paradas.map((p, i) => {
              const itensDaParada = Array.isArray(p.itens) && p.itens.length > 0 ? p.itens : null
              const totalParadaKg = itensDaParada
                ? itensDaParada.reduce((s, it) => s + (it.quantidade_kg || 0), 0)
                : (p.quantidade_kg || 0)
              return (
                <div key={p.id} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.clientes?.nome_propriedade}</p>
                    {itensDaParada ? (
                      <div className="mt-0.5 space-y-0.5">
                        {itensDaParada.map((it, j) => (
                          <p key={j} className="text-xs text-gray-500">
                            {produtoLabel[it.produto] ?? it.produto} — {it.quantidade_kg.toLocaleString('pt-BR')} kg
                          </p>
                        ))}
                        <p className="text-xs font-medium text-gray-600">Total: {totalParadaKg.toLocaleString('pt-BR')} kg</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {p.produto ? (produtoLabel[p.produto] ?? p.produto) : ''} — {(p.quantidade_kg ?? 0).toLocaleString('pt-BR')} kg
                      </p>
                    )}
                    {p.observacoes && <p className="text-xs text-gray-400 mt-0.5">{p.observacoes}</p>}
                  </div>
                  <div className="shrink-0">
                    {(p.pedido_id || pedidoPorCliente.get(p.cliente_id)) ? (
                      <Link
                        href={`/pedidos/${p.pedido_id ?? pedidoPorCliente.get(p.cliente_id)}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded-lg transition-colors"
                      >
                        Ver pedido
                      </Link>
                    ) : (
                      <form action={criarPedidoDaParada.bind(null, p.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-[#193337] hover:text-white border border-[#193337] hover:bg-[#193337] px-2 py-1 rounded-lg transition-colors"
                        >
                          + Criar pedido
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Nenhuma parada cadastrada</p>
        )}
      </div>

      {/* Link público */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-medium text-gray-900 mb-3">Link para o transportador</h2>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 flex-1 truncate font-mono">
            {typeof window !== 'undefined' ? window.location.origin : ''}{linkPublico}
          </p>
        </div>
        <Link
          href={linkPublico}
          target="_blank"
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-green-600 text-green-600 hover:bg-green-50 text-sm font-medium rounded-lg transition-colors"
        >
          Abrir página do transportador ↗
        </Link>
      </div>
    </div>
  )
}
