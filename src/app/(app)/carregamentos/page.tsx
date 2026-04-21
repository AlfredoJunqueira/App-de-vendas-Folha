import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import CalendarioGrid from '@/components/carregamentos/CalendarioGrid'
import GraficoLocais from '@/components/carregamentos/GraficoLocais'
import GraficoEmbalagens from '@/components/carregamentos/GraficoEmbalagens'

type Carregamento = {
  id: string
  data: string
  status: string
  transportador_nome: string | null
  locais_carregamento: { nome: string } | null
  paradas: { quantidade_kg: number; quantidade_unidades: number | null; produto: string; clientes: { nome_propriedade: string } | null }[]
}

type Pedido = {
  id: string
  data_entrega_prevista: string | null
  status: string
  quantidade_kg: number
  quantidade_unidades: number | null
  produto: string
  clientes: { nome_propriedade: string } | null
  locais_carregamento: { nome: string } | null
}

const statusPedLabel: Record<string, string> = {
  em_aberto: 'Em aberto',
  confirmado: 'Confirmado',
  entregue: 'Entregue',
}

export default async function CarregamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Detecta colaborador e determina owner efetivo
  let isColaborador = false
  let effectiveOwnerId = user!.id
  try {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('role, employer_id')
      .eq('user_id', user!.id)
      .maybeSingle()
    if (perfil?.role === 'colaborador' && perfil.employer_id) {
      isColaborador = true
      effectiveOwnerId = perfil.employer_id
    }
  } catch {}

  // Para colaboradores usa admin client (bypassa RLS do employer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = isColaborador ? createAdminClient() : supabase

  const hoje = new Date()
  const mesAtualRaw = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [anoRaw, mesRaw] = mesAtualRaw.split('-').map(Number)
  // Rejeita anos claramente inválidos (ex: 1926 ao invés de 2026)
  const anoValido = anoRaw >= 2000 && anoRaw <= 2100 ? anoRaw : hoje.getFullYear()
  const mesValido = mesRaw >= 1 && mesRaw <= 12 ? mesRaw : hoje.getMonth() + 1
  const mesAtual = `${anoValido}-${String(mesValido).padStart(2, '0')}`
  const [ano, mes] = [anoValido, mesValido]
  const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
  const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]

  const [{ data: carregamentos }, { data: pedidos }, { data: produtos }, locaisResult] = await Promise.all([
    db
      .from('carregamentos')
      .select('id, data, status, transportador_nome, locais_carregamento(nome), paradas(quantidade_kg, quantidade_unidades, produto, clientes(nome_propriedade))')
      .eq('owner_id', effectiveOwnerId)
      .gte('data', inicioMes)
      .lte('data', fimMes)
      .order('data'),
    db
      .from('pedidos')
      .select('id, data_entrega_prevista, status, quantidade_kg, quantidade_unidades, produto, clientes(nome_propriedade), locais_carregamento(nome)')
      .eq('owner_id', effectiveOwnerId)
      .neq('status', 'cancelado')
      .is('carregamento_id', null)
      .gte('data_entrega_prevista', inicioMes)
      .lte('data_entrega_prevista', fimMes),
    db
      .from('produtos')
      .select('value, curto, peso_unitario_kg, unidade_embalagem')
      .eq('owner_id', effectiveOwnerId)
      .eq('ativo', true),
    db
      .from('locais_carregamento')
      .select('nome, cor_fonte')
      .eq('owner_id', effectiveOwnerId),
  ])

  // Mapa nome-do-local → cor_fonte (graceful: se a coluna não existir, fica vazio)
  const corFontePorNome: Record<string, string> = {}
  if (!locaisResult.error && locaisResult.data) {
    for (const l of locaisResult.data as { nome: string; cor_fonte?: string | null }[]) {
      if (l.nome && l.cor_fonte) corFontePorNome[l.nome] = l.cor_fonte
    }
  }

  type ProdutoRow = { value: string; curto: string; peso_unitario_kg: number; unidade_embalagem: string }
  const produtosTyped = (produtos ?? []) as ProdutoRow[]
  const produtoCurto: Record<string, string> = Object.fromEntries(
    produtosTyped.map(p => [p.value, p.curto])
  )
  const produtoEmbalagem: Record<string, { peso: number; unidade: string }> = Object.fromEntries(
    produtosTyped
      .filter(p => p.peso_unitario_kg && p.unidade_embalagem)
      .map(p => [p.value, { peso: p.peso_unitario_kg, unidade: p.unidade_embalagem }])
  )

  const diasNoMes = new Date(ano, mes, 0).getDate()
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay()

  const mesAnterior = new Date(ano, mes - 2, 1)
  const mesSeguinte = new Date(ano, mes, 1)
  const mesAnteriorStr = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
  const mesSeguinteStr = `${mesSeguinte.getFullYear()}-${String(mesSeguinte.getMonth() + 1).padStart(2, '0')}`
  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1))
  const hojeStr = hoje.toISOString().split('T')[0]

  // Resumo
  const totalCarregamentos = carregamentos?.length ?? 0
  const totalTon = (carregamentos as Carregamento[] | null)?.reduce((s, c) => {
    return s + (c.paradas?.reduce((ps, p) => ps + (p.quantidade_kg || 0), 0) ?? 0) / 1000
  }, 0) ?? 0
  const pedidosPendentes = (pedidos as Pedido[] | null)?.filter(p => p.status !== 'entregue') ?? []
  const tonPedidos = pedidosPendentes.reduce((s, p) => s + (p.quantidade_kg || 0), 0) / 1000

  // Dados para o gráfico por local de carregamento
  const kgPorLocalProduto: Record<string, Record<string, number>> = {}
  const produtosNoGrafico = new Set<string>();
  (carregamentos as Carregamento[] | null)?.forEach(c => {
    const local = (c.locais_carregamento as { nome: string } | null)?.nome ?? 'Sem local definido'
    if (!kgPorLocalProduto[local]) kgPorLocalProduto[local] = {}
    c.paradas?.forEach(p => {
      kgPorLocalProduto[local][p.produto] = (kgPorLocalProduto[local][p.produto] || 0) + p.quantidade_kg
      produtosNoGrafico.add(p.produto)
    })
  })
  const graficoData = Object.entries(kgPorLocalProduto)
    .map(([local, prods]) => ({
      local,
      total: Object.values(prods).reduce((s, v) => s + v, 0),
      ...prods,
    }))
    .sort((a, b) => b.total - a.total)
  const graficoSeries = Array.from(produtosNoGrafico).map(v => ({
    value: v,
    label: produtoCurto[v] ?? v,
  }))

  // Dados para gráfico de embalagens (fardos/bolas) por local
  const embalagemPorLocal: Record<string, Record<string, number>> = {}
  const tiposEmbalagem = new Set<string>();
  (carregamentos as Carregamento[] | null)?.forEach(c => {
    const local = (c.locais_carregamento as { nome: string } | null)?.nome ?? 'Sem local definido'
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
      const totalA = Object.entries(a).filter(([k]) => k !== 'local').reduce((s, [, v]) => s + (v as unknown as number), 0)
      const totalB = Object.entries(b).filter(([k]) => k !== 'local').reduce((s, [, v]) => s + (v as unknown as number), 0)
      return totalB - totalA
    })
  const tiposEmbalagemArr = Array.from(tiposEmbalagem)

  // Tabela: unidades e peso médio por produto no mês
  type ResumoProduto = {
    curto: string
    unidade: string
    totalUnidades: number
    totalKg: number
    pesoMedio: number | null
    temPesagemReal: boolean
  }
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
        resumoMap[p.produto] = {
          curto: produtoCurto[p.produto] ?? p.produto,
          unidade: emb.unidade,
          unidadesReais: 0, kgReal: 0,
          unidadesEstimadas: 0, kgTotal: 0,
        }
      }
      const r = resumoMap[p.produto]
      r.kgTotal += p.quantidade_kg
      if (p.quantidade_unidades != null) {
        r.unidadesReais += p.quantidade_unidades
        r.kgReal += p.quantidade_kg
      } else {
        r.unidadesEstimadas += Math.round(p.quantidade_kg / emb.peso)
      }
    })
  })
  const tabelaProdutos: ResumoProduto[] = Object.values(resumoMap)
    .map(r => ({
      curto: r.curto,
      unidade: r.unidade,
      totalUnidades: r.unidadesReais + r.unidadesEstimadas,
      totalKg: r.kgTotal,
      pesoMedio: r.unidadesReais > 0 ? Math.round((r.kgReal / r.unidadesReais) * 100) / 100 : null,
      temPesagemReal: r.unidadesReais > 0,
    }))
    .sort((a, b) => b.totalKg - a.totalKg)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#193337]">Calendário de Carregamentos</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/carregamentos/imprimir?mes=${mesAtual}`}
            target="_blank"
            className="border border-[#193337] text-[#193337] hover:bg-[#193337] hover:text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            Imprimir PDF
          </Link>
          {!isColaborador && (
            <Link
              href="/carregamentos/novo"
              className="bg-[#193337] hover:bg-[#015046] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Novo carregamento
            </Link>
          )}
        </div>
      </div>

      <CalendarioGrid
        key={`${ano}-${mes}`}
        carregamentosIniciais={(carregamentos as unknown as Carregamento[]) ?? []}
        pedidos={(pedidos as unknown as Pedido[]) ?? []}
        produtoCurto={produtoCurto}
        produtoEmbalagem={produtoEmbalagem}
        corFontePorNome={corFontePorNome}
        ano={ano}
        mes={mes}
        diasNoMes={diasNoMes}
        primeiroDiaSemana={primeiroDiaSemana}
        hojeStr={hojeStr}
        nomeMes={nomeMes}
        mesAnteriorStr={mesAnteriorStr}
        mesSeguinteStr={mesSeguinteStr}
      />

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
        <span className="font-medium text-gray-500 uppercase tracking-wide text-[10px]">Carregamentos:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#9ca3af' }} /> Rascunho</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#015046' }} /> Confirmado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#D2D82B' }} /> Em rota</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#49B171' }} /> Entregue</span>
        <span className="mx-1 text-gray-300">|</span>
        <span className="font-medium text-gray-500 uppercase tracking-wide text-[10px]">Pedidos:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#f59e0b' }} /> Em aberto</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#3b82f6' }} /> Confirmado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#eab308' }} /> Ag. pesagem</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#49B171' }} /> Entregue</span>
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#193337]">{totalCarregamentos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Carregamentos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#193337]">{totalTon.toFixed(1)} t</p>
          <p className="text-xs text-gray-500 mt-0.5">Toneladas carregadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{tonPedidos.toFixed(1)} t</p>
          <p className="text-xs text-gray-500 mt-0.5">Pedidos a entregar</p>
        </div>
      </div>

      {/* Gráfico por local de carregamento */}
      {graficoData.length > 0 && (
        <GraficoLocais data={graficoData as unknown as ({ local: string; total: number } & Record<string, number>)[]} series={graficoSeries} nomeMes={nomeMes} />
      )}

      {/* Gráfico de embalagens por local */}
      {graficoEmbalagemData.length > 0 && tiposEmbalagemArr.length > 0 && (
        <GraficoEmbalagens data={graficoEmbalagemData as unknown as ({ local: string } & Record<string, number>)[]} tipos={tiposEmbalagemArr} nomeMes={nomeMes} />
      )}

      {/* Tabela de unidades e peso médio por produto */}
      {tabelaProdutos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-[#193337] mb-3">
            Unidades carregadas no mês
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 pb-2">Produto</th>
                <th className="text-right text-xs font-semibold text-gray-500 pb-2">Quantidade</th>
                <th className="text-right text-xs font-semibold text-gray-500 pb-2">Total (kg)</th>
                <th className="text-right text-xs font-semibold text-gray-500 pb-2">Peso médio</th>
              </tr>
            </thead>
            <tbody>
              {tabelaProdutos.map(p => (
                <tr key={p.curto} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-900 font-medium">{p.curto}</td>
                  <td className="py-2 text-right text-gray-700">
                    {p.totalUnidades.toLocaleString('pt-BR')}{' '}
                    <span className="text-gray-400">{p.unidade}s</span>
                    {!p.temPesagemReal && (
                      <span className="ml-1 text-gray-300 text-[10px]">~</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-700">
                    {p.totalKg.toLocaleString('pt-BR')} kg
                  </td>
                  <td className="py-2 text-right">
                    {p.pesoMedio != null
                      ? <span className="text-gray-700">{p.pesoMedio.toLocaleString('pt-BR')} kg</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de pedidos pendentes */}
      {pedidosPendentes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-[#193337] mb-3">
            Pedidos com entrega prevista no mês ({pedidosPendentes.length})
          </h2>
          <div className="space-y-2">
            {pedidosPendentes.map(p => {
              const data = p.data_entrega_prevista
                ? new Intl.DateTimeFormat('pt-BR').format(new Date(p.data_entrega_prevista + 'T12:00:00'))
                : '—'
              return (
                <Link
                  key={p.id}
                  href={`/pedidos/${p.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(p.clientes as { nome_propriedade: string } | null)?.nome_propriedade}
                    </p>
                    <p className="text-xs text-gray-500">Entrega: {data}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{p.quantidade_kg} kg</p>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: p.status === 'em_aberto' ? '#fef3c7' : '#dbeafe',
                        color: p.status === 'em_aberto' ? '#92400e' : '#1e40af',
                      }}
                    >
                      {statusPedLabel[p.status]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
