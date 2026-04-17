'use client'

import { useState, useTransition } from 'react'
import { salvarPlanejamento } from '@/lib/actions/planejamento'
import type { LinhaPlanejamento, MesInfo } from '@/app/(app)/planejamento/page'

type Props = {
  linhas: LinhaPlanejamento[]
  meses: MesInfo[]
  mesAtual: string
  totalClientesSemCompraRecente: number
}

function fmt(val: number): string {
  return val === 0 ? '—' : val.toLocaleString('pt-BR')
}

function fmtMedia(val: number): string {
  if (val === 0) return '—'
  return val % 1 === 0 ? val.toLocaleString('pt-BR') : val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

export default function TabelaPlanejamento({ linhas, meses, mesAtual, totalClientesSemCompraRecente }: Props) {
  // Estado das metas: chave = "clienteId__produto"
  const [metas, setMetas] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const linha of linhas) {
      init[`${linha.clienteId}__${linha.produto}`] = linha.metaInicial
    }
    return init
  })

  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function getMeta(linha: LinhaPlanejamento): number {
    return metas[`${linha.clienteId}__${linha.produto}`] ?? linha.metaInicial
  }

  function setMeta(linha: LinhaPlanejamento, valor: number) {
    setMetas(prev => ({ ...prev, [`${linha.clienteId}__${linha.produto}`]: valor }))
    setSalvo(false)
  }

  // Cards de resumo — calculados em tempo real
  const linhasComMeta = linhas.filter(l => getMeta(l) > 0).length

  const produtosDistintos = new Set(linhas.map(l => l.produto)).size

  const clientesIds = [...new Set(linhas.map(l => l.clienteId))]
  const clientesComMixCompleto = clientesIds.filter(clienteId => {
    const linhasDoCliente = linhas.filter(l => l.clienteId === clienteId)
    return linhasDoCliente.every(l => getMeta(l) > 0)
  }).length

  // Maior média para a mini barra proporcional
  const maiorMedia = Math.max(...linhas.map(l => l.media), 1)

  function handleSalvar() {
    setSalvo(false)
    setErro(null)
    startTransition(async () => {
      try {
        const dados = linhas.map(l => ({
          clienteId: l.clienteId,
          produto: l.produto,
          unidade: l.unidade,
          metaVolume: getMeta(l),
          mediaHistorica: l.media,
          tipoMix: l.tipoMix,
        }))
        await salvarPlanejamento(mesAtual, dados)
        setSalvo(true)
        // Marca no localStorage que o mês foi planejado
        try {
          localStorage.setItem(`planejamento_vendas_${mesAtual}`, '1')
        } catch { /* ignore */ }
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao salvar')
      }
    })
  }

  if (linhas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-500 text-sm">Nenhum cliente ativo com compras nos últimos 4 meses.</p>
        <p className="text-xs text-gray-400 mt-1">
          Adicione pedidos para clientes ativos para que eles apareçam aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Linhas com meta</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{linhasComMeta}</p>
          <p className="text-xs text-gray-400 mt-0.5">de {linhas.length} no total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Produtos no planejamento</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{produtosDistintos}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Clientes com mix completo</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{clientesComMixCompleto}</p>
          <p className="text-xs text-gray-400 mt-0.5">de {clientesIds.length} clientes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Sem compra recente</p>
          <p className={`text-2xl font-bold mt-1 ${totalClientesSemCompraRecente > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {totalClientesSemCompraRecente}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">clientes (+60 dias)</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Cliente
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Produto
                </th>
                {meses.map((mes, i) => (
                  <th
                    key={i}
                    className="text-right px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {mes.label}
                  </th>
                ))}
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Média (4m)
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Meta do mês
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Var.
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, idx) => {
                const meta = getMeta(linha)
                const varPct = linha.media === 0
                  ? null
                  : Math.round(((meta - linha.media) / linha.media) * 100)

                const varColor =
                  varPct === null ? 'text-gray-400'
                  : varPct > 0 ? 'text-green-600'
                  : varPct < 0 ? 'text-red-500'
                  : 'text-blue-600'

                const barWidth = linha.media === 0 ? 0 : Math.round((linha.media / maiorMedia) * 100)

                return (
                  <tr
                    key={`${linha.clienteId}__${linha.produto}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      linha.isFirstRowOfGroup && idx > 0
                        ? 'border-t-2 border-gray-300'
                        : 'border-t border-gray-100'
                    }`}
                  >
                    {/* Cliente */}
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {linha.isFirstRowOfGroup ? linha.clienteNome : ''}
                    </td>

                    {/* Produto */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          linha.tipoMix === 'principal'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {linha.produtoLabel}
                      </span>
                    </td>

                    {/* Volumes mensais */}
                    {linha.volumes.map((vol, i) => (
                      <td key={i} className="px-3 py-2.5 text-right text-sm text-gray-600 whitespace-nowrap tabular-nums">
                        {fmt(vol)}
                        {vol > 0 && <span className="text-xs text-gray-400 ml-0.5">{linha.unidade}</span>}
                      </td>
                    ))}

                    {/* Média + mini barra */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm text-gray-700 tabular-nums">
                          {fmtMedia(linha.media)}
                          {linha.media > 0 && <span className="text-xs text-gray-400 ml-0.5">{linha.unidade}</span>}
                        </span>
                        {linha.media > 0 && (
                          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-300 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Meta editável */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={meta === 0 ? '' : meta}
                          placeholder="0"
                          onChange={e => setMeta(linha, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400 tabular-nums"
                        />
                        <span className="text-xs text-gray-400">{linha.unidade}</span>
                      </div>
                    </td>

                    {/* Variação */}
                    <td className={`px-3 py-2.5 text-right text-sm font-medium tabular-nums whitespace-nowrap ${varColor}`}>
                      {varPct === null ? '—' : `${varPct > 0 ? '+' : ''}${varPct}%`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé com botão salvar */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Badge azul = mix principal (≥3 meses) · Badge cinza = ocasional
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {salvo && (
              <span className="text-xs text-green-600 font-medium">Salvo com sucesso!</span>
            )}
            {erro && (
              <span className="text-xs text-red-500">{erro}</span>
            )}
            <button
              onClick={handleSalvar}
              disabled={isPending}
              className="px-4 py-2 bg-[#193337] hover:bg-[#015046] disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isPending ? 'Salvando...' : 'Salvar metas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
