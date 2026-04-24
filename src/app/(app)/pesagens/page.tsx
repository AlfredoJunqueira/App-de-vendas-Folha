import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { registrarPesagem } from '@/lib/actions/pesagens'

export default async function PesagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: pedidos }, { data: produtosDb }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        id,
        quantidade_kg,
        quantidade_unidades,
        produto,
        itens,
        data_entrega_prevista,
        carregamento_id,
        clientes(nome_propriedade),
        carregamentos(id, data, transportador_nome, transportador_placa, paradas(id, quantidade_unidades, quantidade_kg, produto))
      `)
      .eq('owner_id', user!.id)
      .eq('status', 'aguardando_pesagem')
      .order('data_entrega_prevista', { ascending: true }),
    supabase
      .from('produtos')
      .select('value, unidade_embalagem')
      .eq('owner_id', user!.id),
  ])

  // Mapa produto value → unidade (bola, fardo, etc.)
  const produtoUnidade: Record<string, string> = Object.fromEntries(
    (produtosDb ?? [])
      .filter(p => p.unidade_embalagem)
      .map(p => [p.value, p.unidade_embalagem as string])
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pesagens pendentes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registre o peso real da carga após a pesagem oficial do caminhão.
        </p>
      </div>

      {(!pedidos || pedidos.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Nenhum pedido aguardando pesagem.</p>
          <Link href="/pedidos" className="mt-3 inline-block text-sm text-green-600 hover:underline">
            Ver todos os pedidos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cliente = (pedido.clientes as any)?.nome_propriedade ?? '—'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const carr = pedido.carregamentos as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const itens = Array.isArray(pedido.itens) ? (pedido.itens as any[]) : null

            const totalUnidades = carr?.paradas
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? (carr.paradas as any[]).reduce((s: number, p: any) => s + (p.quantidade_unidades ?? 0), 0)
              : (pedido.quantidade_unidades ?? 0)

            const unidade = produtoUnidade[pedido.produto]

            const action = registrarPesagem.bind(null, pedido.id)

            return (
              <div key={pedido.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Cabeçalho: cliente + link */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{cliente}</p>
                    {pedido.data_entrega_prevista && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Entrega prevista: {new Date(pedido.data_entrega_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="text-xs text-green-600 hover:underline shrink-0 ml-4"
                  >
                    Ver pedido →
                  </Link>
                </div>

                {!pedido.carregamento_id && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    Sem carregamento vinculado — o peso será registrado diretamente no pedido, sem distribuição por paradas.
                  </p>
                )}

                {/* Produtos do pedido */}
                <div className="mb-3 space-y-1">
                  {itens && itens.length > 0 ? itens.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.produto}</span>
                      <span className="text-gray-500 tabular-nums">
                        {item.quantidade_unidades ? `${item.quantidade_unidades} un · ` : ''}
                        ~{Number(item.quantidade_kg).toLocaleString('pt-BR')} kg estimados
                      </span>
                    </div>
                  )) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{pedido.produto}</span>
                      <span className="text-gray-500 tabular-nums">
                        {pedido.quantidade_unidades ? `${pedido.quantidade_unidades} un · ` : ''}
                        ~{Number(pedido.quantidade_kg).toLocaleString('pt-BR')} kg estimados
                      </span>
                    </div>
                  )}
                </div>

                {/* Info do carregamento */}
                {carr && (
                  <div className="text-xs text-gray-400 mb-4 flex flex-wrap gap-x-4 gap-y-0.5">
                    {carr.data && (
                      <span>Carregamento: {new Date(carr.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                    {carr.transportador_nome && <span>Motorista: {carr.transportador_nome}</span>}
                    {carr.transportador_placa && <span>Placa: {carr.transportador_placa}</span>}
                    {totalUnidades > 0 && <span>Total: {totalUnidades} unidades</span>}
                  </div>
                )}

                {/* Formulário de pesagem */}
                <form action={action} className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Peso real da carga (kg)
                      </label>
                      <input
                        type="number"
                        name="peso_total_kg"
                        required
                        min="1"
                        step="0.01"
                        placeholder="Ex: 24500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {unidade && (
                      <div className="w-36">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Qtd. real ({unidade}s)
                        </label>
                        <input
                          type="number"
                          name="quantidade_unidades_real"
                          min="1"
                          step="1"
                          placeholder={totalUnidades > 0 ? String(totalUnidades) : 'Opcional'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Registrar pesagem
                    </button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
