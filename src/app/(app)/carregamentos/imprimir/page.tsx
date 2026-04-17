import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/carregamentos/PrintButton'
import GraficosPrint from '@/components/carregamentos/GraficosPrint'

type Parada = {
  quantidade_kg: number
  quantidade_unidades: number | null
  produto: string
  clientes: { nome_propriedade: string } | null
}

type Carregamento = {
  id: string
  data: string
  status: string
  locais_carregamento: { nome: string } | null
  paradas: Parada[]
}

type Pedido = {
  id: string
  data_entrega_prevista: string | null
  status: string
  quantidade_kg: number
  produto: string
  clientes: { nome_propriedade: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  em_rota: 'Em rota',
  entregue: 'Entregue',
}

const STATUS_BG: Record<string, string> = {
  rascunho: '#9ca3af',
  confirmado: '#015046',
  em_rota: '#D2D82B',
  entregue: '#49B171',
}

const STATUS_TEXT: Record<string, string> = {
  rascunho: '#fff',
  confirmado: '#fff',
  em_rota: '#193337',
  entregue: '#fff',
}

const PED_BG: Record<string, string> = {
  em_aberto: '#f59e0b',
  confirmado: '#3b82f6',
  entregue: '#49B171',
}

export default async function ImprimirCarregamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = new Date()
  const mesAtual = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [ano, mes] = mesAtual.split('-').map(Number)
  const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]

  const [{ data: carregamentos }, { data: pedidos }, { data: produtos }] = await Promise.all([
    supabase
      .from('carregamentos')
      .select('id, data, status, locais_carregamento(nome), paradas(quantidade_kg, quantidade_unidades, produto, clientes(nome_propriedade))')
      .eq('owner_id', user!.id)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data'),
    supabase
      .from('pedidos')
      .select('id, data_entrega_prevista, status, quantidade_kg, produto, clientes(nome_propriedade)')
      .eq('owner_id', user!.id)
      .neq('status', 'cancelado')
      .is('carregamento_id', null)
      .gte('data_entrega_prevista', inicioMes)
      .lte('data_entrega_prevista', fimMes),
    supabase
      .from('produtos')
      .select('value, curto, peso_unitario_kg, unidade_embalagem')
      .eq('owner_id', user!.id)
      .eq('ativo', true),
  ])

  const produtoCurto: Record<string, string> = Object.fromEntries(
    (produtos ?? []).map(p => [p.value, p.curto])
  )
  const produtoEmbalagem: Record<string, { peso: number; unidade: string }> = Object.fromEntries(
    (produtos ?? [])
      .filter(p => p.peso_unitario_kg && p.unidade_embalagem)
      .map(p => [p.value, { peso: p.peso_unitario_kg, unidade: p.unidade_embalagem }])
  )

  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1))
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay()
  const hojeStr = hoje.toISOString().split('T')[0]

  // Monta dayMap
  const dayMap = new Map<string, { carregamentos: Carregamento[]; pedidos: Pedido[] }>()
  for (let d = 1; d <= diasNoMes; d++) {
    const key = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dayMap.set(key, { carregamentos: [], pedidos: [] })
  }
  ;(carregamentos as Carregamento[] | null)?.forEach(c => {
    const k = c.data?.slice(0, 10)
    if (k) dayMap.get(k)?.carregamentos.push(c)
  })
  ;(pedidos as Pedido[] | null)?.forEach(p => {
    const k = p.data_entrega_prevista?.slice(0, 10)
    if (k) dayMap.get(k)?.pedidos.push(p)
  })

  // Resumo
  const totalCarregamentos = carregamentos?.length ?? 0
  const totalTon = (carregamentos as Carregamento[] | null)?.reduce((s, c) =>
    s + (c.paradas?.reduce((ps, p) => ps + (p.quantidade_kg || 0), 0) ?? 0) / 1000, 0) ?? 0
  const pedidosPendentes = (pedidos as Pedido[] | null)?.filter(p => p.status !== 'entregue') ?? []
  const tonPedidos = pedidosPendentes.reduce((s, p) => s + (p.quantidade_kg || 0), 0) / 1000

  // Tabela por produto
  const resumoMap: Record<string, {
    curto: string; unidade: string
    unidadesReais: number; kgReal: number
    unidadesEstimadas: number; kgTotal: number
  }> = {};
  (carregamentos as Carregamento[] | null)?.forEach(c => {
    c.paradas?.forEach(p => {
      const emb = produtoEmbalagem[p.produto]
      if (!emb) return
      if (!resumoMap[p.produto]) {
        resumoMap[p.produto] = { curto: produtoCurto[p.produto] ?? p.produto, unidade: emb.unidade, unidadesReais: 0, kgReal: 0, unidadesEstimadas: 0, kgTotal: 0 }
      }
      const r = resumoMap[p.produto]
      r.kgTotal += p.quantidade_kg
      if (p.quantidade_unidades != null) {
        r.unidadesReais += p.quantidade_unidades; r.kgReal += p.quantidade_kg
      } else {
        r.unidadesEstimadas += Math.round(p.quantidade_kg / emb.peso)
      }
    })
  })
  const tabelaProdutos = Object.values(resumoMap)
    .map(r => ({
      curto: r.curto, unidade: r.unidade,
      totalUnidades: r.unidadesReais + r.unidadesEstimadas,
      totalKg: r.kgTotal,
      pesoMedio: r.unidadesReais > 0 ? Math.round((r.kgReal / r.unidadesReais) * 100) / 100 : null,
      estimado: r.unidadesReais === 0,
    }))
    .sort((a, b) => b.totalKg - a.totalKg)

  // Dados dos gráficos
  const kgPorLocalProduto: Record<string, Record<string, number>> = {}
  const produtosNoGrafico = new Set<string>();
  (carregamentos as Carregamento[] | null)?.forEach(c => {
    const local = c.locais_carregamento?.nome ?? 'Sem local'
    if (!kgPorLocalProduto[local]) kgPorLocalProduto[local] = {}
    c.paradas?.forEach(p => {
      kgPorLocalProduto[local][p.produto] = (kgPorLocalProduto[local][p.produto] || 0) + p.quantidade_kg
      produtosNoGrafico.add(p.produto)
    })
  })
  const graficoData = Object.entries(kgPorLocalProduto)
    .map(([local, prods]) => ({ local, total: Object.values(prods).reduce((s, v) => s + v, 0), ...prods }))
    .sort((a, b) => b.total - a.total)
  const graficoSeries = Array.from(produtosNoGrafico).map(v => ({ value: v, label: produtoCurto[v] ?? v }))

  const embalagemPorLocal: Record<string, Record<string, number>> = {}
  const tiposEmbalagem = new Set<string>();
  (carregamentos as Carregamento[] | null)?.forEach(c => {
    const local = c.locais_carregamento?.nome ?? 'Sem local'
    if (!embalagemPorLocal[local]) embalagemPorLocal[local] = {}
    c.paradas?.forEach(p => {
      const emb = produtoEmbalagem[p.produto]
      if (!emb) return
      const unidade = emb.unidade.charAt(0).toUpperCase() + emb.unidade.slice(1) + 's'
      const qtd = p.quantidade_unidades != null ? p.quantidade_unidades : Math.round(p.quantidade_kg / emb.peso)
      embalagemPorLocal[local][unidade] = (embalagemPorLocal[local][unidade] || 0) + qtd
      tiposEmbalagem.add(unidade)
    })
  })
  const graficoEmbalagemData = Object.entries(embalagemPorLocal)
    .map(([local, tipos]) => ({ local, ...tipos }))
    .sort((a, b) => {
      const tA = Object.entries(a).filter(([k]) => k !== 'local').reduce((s, [, v]) => s + (v as unknown as number), 0)
      const tB = Object.entries(b).filter(([k]) => k !== 'local').reduce((s, [, v]) => s + (v as unknown as number), 0)
      return tB - tA
    })
  const tiposEmbalagemArr = Array.from(tiposEmbalagem)

  const diasArray = Array.from({ length: diasNoMes }, (_, i) => i + 1)
  const padding = Array.from({ length: primeiroDiaSemana })
  const geradoEm = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <PrintButton />

      <div className="print:text-[8pt] text-[9pt] font-sans bg-white min-h-screen p-4 print:p-0">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-[#193337]">
          <div>
            <h1 className="text-[13pt] font-bold text-[#193337] capitalize leading-tight">{nomeMes}</h1>
            <p className="text-[7pt] text-gray-400">Calendário de Carregamentos</p>
          </div>
          <div className="text-right text-[7pt] text-gray-400">
            <p>Gerado em {geradoEm}</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex gap-3 mb-2">
          <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-3 py-1.5 text-center">
            <p className="text-[12pt] font-bold text-[#193337] leading-none">{totalCarregamentos}</p>
            <p className="text-[6.5pt] text-gray-500 mt-0.5">Carregamentos</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-3 py-1.5 text-center">
            <p className="text-[12pt] font-bold text-[#193337] leading-none">{totalTon.toFixed(1)} t</p>
            <p className="text-[6.5pt] text-gray-500 mt-0.5">Toneladas carregadas</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded border border-gray-200 px-3 py-1.5 text-center">
            <p className="text-[12pt] font-bold text-amber-500 leading-none">{tonPedidos.toFixed(1)} t</p>
            <p className="text-[6.5pt] text-gray-500 mt-0.5">Pedidos a entregar</p>
          </div>
        </div>

        {/* Calendário */}
        <div className="border border-gray-200 rounded overflow-hidden mb-2">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 bg-[#193337]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-0.5 text-center text-[6.5pt] font-semibold text-white uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 border-l border-gray-200">
            {padding.map((_, i) => (
              <div key={`pad-${i}`} className="border-b border-r border-gray-200 bg-gray-50" style={{ minHeight: '52px' }} />
            ))}

            {diasArray.map(dia => {
              const key = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const dayData = dayMap.get(key)!
              const isHoje = key === hojeStr
              const col = (primeiroDiaSemana + dia - 1) % 7
              const isFimDeSemana = col === 0 || col === 6

              return (
                <div
                  key={key}
                  style={{ minHeight: '52px' }}
                  className={`border-b border-r border-gray-200 p-0.5 flex flex-col gap-px ${
                    isHoje ? 'bg-[#EAF5F5]' : isFimDeSemana ? 'bg-gray-50' : ''
                  }`}
                >
                  <span
                    className={`text-[7pt] font-bold w-4 h-4 flex items-center justify-center rounded-full mb-px ${
                      isHoje ? 'bg-[#D2D82B] text-[#193337]' : isFimDeSemana ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {dia}
                  </span>

                  {dayData.carregamentos.map(c => {
                    const paradas = c.paradas ?? []
                    const kg = paradas.reduce((s, p) => s + (p.quantidade_kg || 0), 0)
                    const bg = STATUS_BG[c.status] ?? '#9ca3af'
                    const tc = STATUS_TEXT[c.status] ?? '#fff'

                    // Monta linha de unidades
                    const unidadesPorProduto = paradas.reduce<Record<string, { un: number | null; kg: number }>>((acc, p) => {
                      if (!acc[p.produto]) acc[p.produto] = { un: null, kg: 0 }
                      acc[p.produto].kg += p.quantidade_kg
                      if (p.quantidade_unidades != null) acc[p.produto].un = (acc[p.produto].un ?? 0) + p.quantidade_unidades
                      return acc
                    }, {})
                    const unidadesStr = Object.entries(unidadesPorProduto)
                      .map(([prod, { un, kg: kg2 }]) => {
                        const emb = produtoEmbalagem[prod]
                        if (!emb) return null
                        const qtd = un != null ? un : Math.round(kg2 / emb.peso)
                        return `${un == null ? '~' : ''}${qtd.toLocaleString('pt-BR')} ${emb.unidade}s`
                      })
                      .filter(Boolean)
                      .join(', ')

                    return (
                      <div
                        key={c.id}
                        style={{ backgroundColor: bg, color: tc }}
                        className="text-[6pt] px-1 py-px rounded leading-tight"
                      >
                        <div className="font-semibold">{(kg / 1000).toFixed(1)} t{unidadesStr ? ` · ${unidadesStr}` : ''}</div>
                        {paradas.length === 1 && paradas[0].clientes?.nome_propriedade && (
                          <div className="opacity-90 truncate">{paradas[0].clientes.nome_propriedade}</div>
                        )}
                        {paradas.length > 1 && (
                          <div className="opacity-85">{paradas.length} clientes</div>
                        )}
                        {c.locais_carregamento?.nome && (
                          <div className="opacity-80 truncate">{c.locais_carregamento.nome}</div>
                        )}
                      </div>
                    )
                  })}

                  {dayData.pedidos.map(p => (
                    <div
                      key={p.id}
                      style={{ backgroundColor: PED_BG[p.status] ?? '#9ca3af', color: '#fff' }}
                      className="text-[6pt] px-1 py-px rounded leading-tight"
                    >
                      <div className="font-semibold truncate">📦 {p.clientes?.nome_propriedade}</div>
                      <div className="opacity-85">{p.quantidade_kg.toLocaleString('pt-BR')} kg</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[6.5pt] text-gray-600 mb-2">
          <span className="font-semibold text-gray-400 uppercase tracking-wide">Carregamentos:</span>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: STATUS_BG[k] }} /> {v}
            </span>
          ))}
          <span className="mx-1 text-gray-300">|</span>
          <span className="font-semibold text-gray-400 uppercase tracking-wide">Pedidos:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-amber-400" /> Em aberto</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-blue-500" /> Confirmado</span>
        </div>

        {/* Gráficos */}
        {graficoData.length > 0 && (
          <GraficosPrint
            graficoData={graficoData as ({ local: string; total: number } & Record<string, number>)[]}
            graficoSeries={graficoSeries}
            graficoEmbalagemData={graficoEmbalagemData as ({ local: string } & Record<string, number>)[]}
            tiposEmbalagem={tiposEmbalagemArr}
            nomeMes={nomeMes}
          />
        )}

        {/* Seção inferior: tabela de produtos + pedidos pendentes lado a lado */}
        <div className="flex gap-3 items-start">

          {/* Tabela de unidades por produto */}
          {tabelaProdutos.length > 0 && (
            <div className="flex-1 border border-gray-200 rounded overflow-hidden">
              <div className="bg-[#193337] px-2 py-1">
                <h2 className="text-[7.5pt] font-semibold text-white">Unidades carregadas</h2>
              </div>
              <table className="w-full text-[7pt]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-2 py-1 text-gray-500 font-semibold">Produto</th>
                    <th className="text-right px-2 py-1 text-gray-500 font-semibold">Qtd</th>
                    <th className="text-right px-2 py-1 text-gray-500 font-semibold">Total kg</th>
                    <th className="text-right px-2 py-1 text-gray-500 font-semibold">Peso médio</th>
                  </tr>
                </thead>
                <tbody>
                  {tabelaProdutos.map(p => (
                    <tr key={p.curto} className="border-b border-gray-100 last:border-0">
                      <td className="px-2 py-0.5 text-gray-900 font-medium">{p.curto}</td>
                      <td className="px-2 py-0.5 text-right text-gray-700">
                        {p.estimado && <span className="text-gray-400">~</span>}
                        {p.totalUnidades.toLocaleString('pt-BR')} {p.unidade}s
                      </td>
                      <td className="px-2 py-0.5 text-right text-gray-700">
                        {p.totalKg.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-2 py-0.5 text-right text-gray-500">
                        {p.pesoMedio != null ? `${p.pesoMedio.toLocaleString('pt-BR')} kg` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pedidos pendentes */}
          {pedidosPendentes.length > 0 && (
            <div className="flex-1 border border-gray-200 rounded overflow-hidden">
              <div className="bg-amber-500 px-2 py-1">
                <h2 className="text-[7.5pt] font-semibold text-white">Pedidos pendentes ({pedidosPendentes.length})</h2>
              </div>
              <table className="w-full text-[7pt]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-2 py-1 text-gray-500 font-semibold">Cliente</th>
                    <th className="text-left px-2 py-1 text-gray-500 font-semibold">Entrega</th>
                    <th className="text-right px-2 py-1 text-gray-500 font-semibold">Kg</th>
                    <th className="text-right px-2 py-1 text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosPendentes.map(p => {
                    const data = p.data_entrega_prevista
                      ? new Intl.DateTimeFormat('pt-BR').format(new Date(p.data_entrega_prevista + 'T12:00:00'))
                      : '—'
                    return (
                      <tr key={p.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-2 py-0.5 text-gray-900 truncate max-w-[100px]">
                          {p.clientes?.nome_propriedade}
                        </td>
                        <td className="px-2 py-0.5 text-gray-600">{data}</td>
                        <td className="px-2 py-0.5 text-right text-gray-700">{p.quantidade_kg.toLocaleString('pt-BR')}</td>
                        <td className="px-2 py-0.5 text-right">
                          <span
                            className="px-1 py-px rounded text-[6pt] font-medium text-white"
                            style={{ backgroundColor: PED_BG[p.status] ?? '#9ca3af' }}
                          >
                            {p.status === 'em_aberto' ? 'Em aberto' : 'Confirmado'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
