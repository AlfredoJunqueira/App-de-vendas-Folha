import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { atualizarPedido } from '@/lib/actions/pedidos'
import PagamentoFields from '@/components/pedidos/PagamentoFields'
import PedidoItensEditor from '@/components/pedidos/PedidoItensEditor'
import type { PedidoItem } from '@/components/pedidos/PedidoItensEditor'

export default async function EditarPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: p } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!p) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedido = p as any

  const [{ data: clientes }, { data: locais }, { data: produtos }] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nome_propriedade, contato')
      .eq('owner_id', user!.id)
      .neq('status', 'inativo')
      .order('nome_propriedade'),
    supabase
      .from('locais_carregamento')
      .select('id, nome, cidade, estado')
      .eq('owner_id', user!.id)
      .eq('ativo', true)
      .order('nome'),
    supabase
      .from('produtos')
      .select('value, label, peso_unitario_kg, unidade_embalagem')
      .eq('owner_id', user!.id)
      .eq('ativo', true)
      .order('ordem'),
  ])

  // Build initialItens: prefer itens column, fallback to single-product fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItens: any[] | null = pedido.itens ?? null
  const initialItens: PedidoItem[] = rawItens && rawItens.length > 0
    ? rawItens.map(i => ({
        produto: String(i.produto ?? ''),
        quantidade_unidades: i.quantidade_unidades != null ? String(i.quantidade_unidades) : '',
        quantidade_kg: String(i.quantidade_kg ?? ''),
        preco_kg: String(i.preco_kg ?? ''),
      }))
    : [{ produto: pedido.produto, quantidade_unidades: '', quantidade_kg: String(pedido.quantidade_kg), preco_kg: String(pedido.preco_kg) }]

  const action = atualizarPedido.bind(null, id)

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/pedidos" className="text-gray-400 hover:text-gray-600 text-sm">Pedidos</Link>
        <span className="text-gray-300">›</span>
        <Link href={`/pedidos/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Detalhe</Link>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-600">Editar</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Editar pedido</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              name="cliente_id"
              required
              defaultValue={pedido.cliente_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecionar cliente</option>
              {clientes?.map(c => (
                <option key={c.id} value={c.id}>{c.nome_propriedade}{c.contato ? ` — ${c.contato}` : ''}</option>
              ))}
            </select>
          </div>

          <PedidoItensEditor
            produtos={produtos ?? []}
            initialItens={initialItens}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de fechamento</label>
              <input
                type="date"
                name="data_fechamento"
                defaultValue={pedido.data_fechamento ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrega prevista</label>
              <input
                type="date"
                name="data_entrega_prevista"
                defaultValue={pedido.data_entrega_prevista ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={pedido.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="em_aberto">Em aberto</option>
              <option value="confirmado">Confirmado</option>
              <option value="aguardando_pesagem">Aguardando pesagem</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <PagamentoFields
            condicao={pedido.condicao_pagamento}
            dataVencimento={pedido.data_vencimento}
            numParcelas={pedido.num_parcelas}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local de carregamento</label>
            <select
              name="local_carregamento_id"
              defaultValue={pedido.local_carregamento_id ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Não definido</option>
              {locais?.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nome}{l.cidade ? ` — ${l.cidade}${l.estado ? `/${l.estado}` : ''}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              name="observacoes"
              rows={2}
              defaultValue={pedido.observacoes ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar alterações
            </button>
            <Link
              href={`/pedidos/${id}`}
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
