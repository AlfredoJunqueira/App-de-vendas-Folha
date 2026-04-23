import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatBRL, formatDate } from '@/lib/utils/format'
import DeletePedidoButton from '@/components/pedidos/DeletePedidoButton'
import { criarCarregamentoDoPedido } from '@/lib/actions/carregamentos'
import { avancarStatusPosEntrega } from '@/lib/actions/pedidos'
export default async function DetalhePedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Tenta buscar com a FK carregamento_id (migration 011+). Se falhar, busca sem o join.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let p: any = null
  {
    const { data } = await supabase
      .from('pedidos')
      .select('*, clientes(id, nome_propriedade, contato, telefone), locais_carregamento(id, nome, cidade, estado), carregamentos(id, data, status)')
      .eq('id', id)
      .eq('owner_id', user!.id)
      .single()
    if (data) {
      p = data
    } else {
      // Fallback sem o join de carregamentos (antes da migration 011)
      const { data: d2 } = await supabase
        .from('pedidos')
        .select('*, clientes(id, nome_propriedade, contato, telefone), locais_carregamento(id, nome, cidade, estado)')
        .eq('id', id)
        .eq('owner_id', user!.id)
        .single()
      p = d2
    }
  }

  if (!p) notFound()

  // Busca todos os pedidos do mesmo mês para navegação prev/next
  const mesDoPedido = p.data_fechamento
    ? p.data_fechamento.slice(0, 7)
    : new Date().toISOString().slice(0, 7)
  const [anoNav, mesNav] = mesDoPedido.split('-').map(Number)
  const inicioMesNav = new Date(anoNav, mesNav - 1, 1).toISOString().split('T')[0]
  const fimMesNav   = new Date(anoNav, mesNav, 0).toISOString().split('T')[0]

  const { data: todosPedidos } = await supabase
    .from('pedidos')
    .select('id, clientes(nome_propriedade)')
    .eq('owner_id', user!.id)
    .gte('data_fechamento', inicioMesNav)
    .lte('data_fechamento', fimMesNav)
    .order('criado_em', { ascending: false })

  const idxAtual    = (todosPedidos ?? []).findIndex(x => x.id === id)
  const pedidoAntes = idxAtual > 0 ? todosPedidos![idxAtual - 1] : null
  const pedidoDepois = idxAtual < (todosPedidos?.length ?? 0) - 1 ? todosPedidos![idxAtual + 1] : null
  const totalNav    = todosPedidos?.length ?? 0

  const { data: produtosDb } = await supabase.from('produtos').select('value, label').eq('owner_id', user!.id)
  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidoAny = p as any
  const itens: { produto: string; quantidade_kg: number; preco_kg: number }[] =
    Array.isArray(pedidoAny.itens) && pedidoAny.itens.length > 0
      ? pedidoAny.itens
      : [{ produto: p.produto, quantidade_kg: p.quantidade_kg, preco_kg: p.preco_kg }]

  const statusLabel: Record<string, string> = {
    em_aberto: 'Em aberto',
    confirmado: 'Confirmado',
    aguardando_pesagem: 'Aguardando pesagem',
    entregue: 'Entregue',
    aguardando_nf: 'Ag. Nota Fiscal',
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

  const STATUS_POS_ENTREGA_PENDENTE = ['entregue', 'aguardando_nf', 'aguardando_boleto']

  const cliente = p.clientes as { id: string; nome_propriedade: string; contato: string | null; telefone: string | null } | null
  const local = p.locais_carregamento as { id: string; nome: string; cidade: string | null; estado: string | null } | null
  const carregamento = p.carregamentos as { id: string; data: string; status: string } | null

  const statusCarLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    em_rota: 'Em rota',
    entregue: 'Entregue',
  }

  return (
    <div className="max-w-xl">
      {/* Breadcrumb + navegação prev/next */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/pedidos" className="text-gray-400 hover:text-gray-600 text-sm">Pedidos</Link>
          <span className="text-gray-300">›</span>
          <span className="text-sm text-gray-600">
            {pedidoAny.numero != null ? `#${String(pedidoAny.numero).padStart(3, '0')}` : 'Detalhe'}
          </span>
        </div>

        {totalNav > 1 && (
          <div className="flex items-center gap-1">
            <Link
              href={pedidoAntes ? `/pedidos/${pedidoAntes.id}` : '#'}
              aria-disabled={!pedidoAntes}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${
                pedidoAntes
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'border-gray-100 text-gray-300 pointer-events-none'
              }`}
              title={pedidoAntes ? (pedidoAntes.clientes as unknown as { nome_propriedade: string } | null)?.nome_propriedade ?? '' : ''}
            >
              ‹ Ant.
            </Link>

            <span className="px-2 text-xs text-gray-400 tabular-nums">
              {idxAtual + 1} / {totalNav}
            </span>

            <Link
              href={pedidoDepois ? `/pedidos/${pedidoDepois.id}` : '#'}
              aria-disabled={!pedidoDepois}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${
                pedidoDepois
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'border-gray-100 text-gray-300 pointer-events-none'
              }`}
              title={pedidoDepois ? (pedidoDepois.clientes as unknown as { nome_propriedade: string } | null)?.nome_propriedade ?? '' : ''}
            >
              Próx. ›
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          {pedidoAny.numero != null && (
            <p className="text-xs font-mono font-semibold text-gray-400 mb-0.5 tracking-wide">
              Pedido #{String(pedidoAny.numero).padStart(3, '0')}
            </p>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{cliente?.nome_propriedade}</h1>
          <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[p.status]}`}>
            {statusLabel[p.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {carregamento ? (
            <Link
              href={`/carregamentos/${carregamento.id}`}
              className="text-sm px-4 py-2 bg-[#193337] hover:bg-[#015046] text-white font-medium rounded-lg transition-colors"
            >
              Ver Carregamento
            </Link>
          ) : (
            <form action={criarCarregamentoDoPedido.bind(null, id)}>
              <button
                type="submit"
                className="text-sm px-4 py-2 bg-[#193337] hover:bg-[#015046] text-white font-medium rounded-lg transition-colors"
              >
                Criar Carregamento
              </button>
            </form>
          )}
          <Link
            href={`/pedidos/${id}/orcamento`}
            className="text-sm px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Orçamento
          </Link>
          <Link
            href={`/pedidos/novo?clonar=${id}`}
            className="text-sm px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Copiar
          </Link>
          <Link
            href={`/pedidos/${id}/editar`}
            className="text-sm px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Editar
          </Link>
          <DeletePedidoButton id={id} />
        </div>
      </div>

      {/* Dados do pedido */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-4">
        <h2 className="font-medium text-gray-900">Dados do pedido</h2>
        {/* Items table */}
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-1.5">Produto</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-1.5">Qtd. (kg)</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-1.5">R$/kg</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-1.5">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {itens.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 pr-2 font-medium text-gray-900">{produtoLabel[item.produto] ?? item.produto}</td>
                  <td className="py-1.5 text-right text-gray-700 tabular-nums">{item.quantidade_kg.toLocaleString('pt-BR')}</td>
                  <td className="py-1.5 text-right text-gray-700 tabular-nums">{formatBRL(item.preco_kg)}</td>
                  <td className="py-1.5 text-right font-medium text-gray-900 tabular-nums">{formatBRL(item.quantidade_kg * item.preco_kg)}</td>
                </tr>
              ))}
            </tbody>
            {itens.length > 1 && (
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={3} className="pt-2 text-xs text-gray-500">Total</td>
                  <td className="pt-2 text-right font-bold text-green-700 tabular-nums">{formatBRL(p.valor_total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {itens.length === 1 && (
            <div className="col-span-2 flex justify-end">
              <div>
                <p className="text-xs text-gray-500">Valor total</p>
                <p className="text-sm font-bold text-green-700 mt-0.5">{formatBRL(p.valor_total)}</p>
              </div>
            </div>
          )}
          {p.condicao_pagamento && (
            <div>
              <p className="text-xs text-gray-500">Pagamento</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {p.condicao_pagamento === 'a_vista' && 'À vista'}
                {p.condicao_pagamento === 'a_prazo' && (
                  <>
                    A prazo
                    {p.data_vencimento && (
                      <span className="text-gray-500 font-normal">
                        {' '}— vence em {new Intl.DateTimeFormat('pt-BR').format(new Date(p.data_vencimento + 'T12:00:00'))}
                      </span>
                    )}
                  </>
                )}
                {p.condicao_pagamento === 'parcelado' && (
                  <>
                    {p.num_parcelas ? `${p.num_parcelas}x` : 'Parcelado'}
                    {p.data_vencimento && (
                      <span className="text-gray-500 font-normal">
                        {' '}— 1ª parcela em {new Intl.DateTimeFormat('pt-BR').format(new Date(p.data_vencimento + 'T12:00:00'))}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          )}
          {p.data_fechamento && (
            <div>
              <p className="text-xs text-gray-500">Data de fechamento</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(p.data_fechamento)}</p>
            </div>
          )}
          {p.data_entrega_prevista && (
            <div>
              <p className="text-xs text-gray-500">Entrega prevista</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(p.data_entrega_prevista)}</p>
            </div>
          )}
        </div>
        {local && (
          <div>
            <p className="text-xs text-gray-500">Local de carregamento</p>
            <Link
              href={`/locais/${local.id}`}
              className="text-sm font-medium text-[#015046] hover:underline mt-0.5 block"
            >
              {local.nome}
              {local.cidade ? ` — ${local.cidade}${local.estado ? `/${local.estado}` : ''}` : ''}
            </Link>
          </div>
        )}
        {p.observacoes && (
          <div>
            <p className="text-xs text-gray-500">Observações</p>
            <p className="text-sm text-gray-700 mt-0.5">{p.observacoes}</p>
          </div>
        )}
      </div>

      {/* Carregamento vinculado */}
      {carregamento && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Carregamento</h2>
            <Link href={`/carregamentos/${carregamento.id}`} className="text-xs text-green-600 hover:underline">
              Abrir
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-900">{formatDate(carregamento.data)}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              carregamento.status === 'rascunho' ? 'bg-gray-100 text-gray-600' :
              carregamento.status === 'confirmado' ? 'bg-blue-100 text-blue-700' :
              carregamento.status === 'em_rota' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {statusCarLabel[carregamento.status]}
            </span>
          </div>
        </div>
      )}

      {/* Pós-entrega */}
      {STATUS_POS_ENTREGA_PENDENTE.includes(p.status) && (
        <div className="bg-white rounded-xl border border-violet-200 p-5 mb-4">
          <h2 className="font-medium text-gray-900 mb-3">Pós-entrega</h2>
          <div className="space-y-2">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              ['aguardando_boleto'].includes(p.status) ? 'bg-green-50' : 'bg-violet-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{['aguardando_boleto'].includes(p.status) ? '✅' : '⏳'}</span>
                <span className="text-sm font-medium text-gray-900">Nota Fiscal emitida</span>
              </div>
              {!['aguardando_boleto'].includes(p.status) && (
                <form action={avancarStatusPosEntrega.bind(null, id)}>
                  <button type="submit" className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
                    Marcar como feito
                  </button>
                </form>
              )}
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg bg-gray-50`}>
              <div className="flex items-center gap-2">
                <span className="text-base">⏳</span>
                <span className="text-sm font-medium text-gray-900">Boletos e docs enviados ao cliente</span>
              </div>
              {p.status === 'aguardando_boleto' && (
                <form action={avancarStatusPosEntrega.bind(null, id)}>
                  <button type="submit" className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Marcar como feito
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cliente */}
      {cliente && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Cliente</h2>
            <Link href={`/clientes/${cliente.id}`} className="text-xs text-green-600 hover:underline">
              Ver perfil
            </Link>
          </div>
          <p className="text-sm font-medium text-gray-900">{cliente.nome_propriedade}</p>
          {cliente.contato && <p className="text-sm text-gray-500 mt-0.5">{cliente.contato}</p>}
          {cliente.telefone && (
            <a href={`tel:${cliente.telefone}`} className="text-sm text-green-600 hover:underline mt-0.5 block">
              {cliente.telefone}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
