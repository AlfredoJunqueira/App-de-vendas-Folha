import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StatusButtons from './StatusButtons'

export default async function TransportadorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: carregamento } = await supabase
    .from('carregamentos')
    .select('*, paradas(*, clientes(nome_propriedade, cidade, estado, telefone))')
    .eq('link_publico_token', token)
    .single()

  if (!carregamento) notFound()

  const { data: produtosDb } = await supabase
    .from('produtos')
    .select('value, label')
    .eq('owner_id', carregamento.owner_id)
  const produtoLabel: Record<string, string> = Object.fromEntries((produtosDb ?? []).map(p => [p.value, p.label]))

  type ParadaItemPublico = { produto: string; quantidade_kg: number }
  const paradas = (carregamento.paradas as {
    id: string
    ordem: number
    produto: string | null
    quantidade_kg: number | null
    itens: ParadaItemPublico[] | null
    observacoes: string | null
    clientes: { nome_propriedade: string; cidade: string | null; estado: string | null; telefone: string | null } | null
  }[]).sort((a, b) => a.ordem - b.ordem)

  const statusLabel: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    em_rota: 'Em rota',
    entregue: 'Entregue',
  }

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date(carregamento.data + 'T00:00:00'))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Cabeçalho */}
        <div className="bg-green-700 text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚛</span>
            <span className="font-semibold text-lg">Roteiro de entrega</span>
          </div>
          <p className="text-green-100 capitalize">{dataFormatada}</p>
          {carregamento.transportador_nome && (
            <p className="mt-2 font-medium">{carregamento.transportador_nome}</p>
          )}
          {carregamento.transportador_placa && (
            <p className="text-green-100 text-sm">Placa: {carregamento.transportador_placa}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {statusLabel[carregamento.status]}
          </div>
        </div>

        {/* Paradas */}
        <div className="space-y-3">
          {paradas.map((p, i) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">{p.clientes?.nome_propriedade}</p>
                  {(p.clientes?.cidade || p.clientes?.estado) && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      📍 {[p.clientes?.cidade, p.clientes?.estado].filter(Boolean).join(' — ')}
                    </p>
                  )}
                  {p.clientes?.telefone && (
                    <a href={`tel:${p.clientes.telefone}`} className="text-sm text-green-600 mt-0.5 block">
                      📞 {p.clientes.telefone}
                    </a>
                  )}
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                    {Array.isArray(p.itens) && p.itens.length > 0 ? (
                      <>
                        {p.itens.map((it, j) => (
                          <div key={j}>
                            <p className="text-sm font-medium text-gray-700">{produtoLabel[it.produto] ?? it.produto}</p>
                            <p className="text-sm text-gray-500">{it.quantidade_kg.toLocaleString('pt-BR')} kg ({(it.quantidade_kg / 1000).toFixed(3)} t)</p>
                          </div>
                        ))}
                        {p.itens.length > 1 && (
                          <p className="text-sm font-semibold text-gray-600 pt-1">
                            Total: {p.itens.reduce((s, it) => s + it.quantidade_kg, 0).toLocaleString('pt-BR')} kg
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">{p.produto ? (produtoLabel[p.produto] ?? p.produto) : ''}</p>
                        <p className="text-sm text-gray-500">{p.quantidade_kg ?? 0} kg ({((p.quantidade_kg ?? 0) / 1000).toFixed(3)} t)</p>
                      </>
                    )}
                  </div>
                  {p.observacoes && (
                    <p className="mt-2 text-sm text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                      ⚠️ {p.observacoes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botões de status */}
        <StatusButtons
          carregamentoId={carregamento.id}
          statusAtual={carregamento.status}
          token={token}
        />
      </div>
    </div>
  )
}
