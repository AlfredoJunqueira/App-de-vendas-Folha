'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { moverCarregamento, criarCarregamentoDoPedido } from '@/lib/actions/carregamentos'

type Carregamento = {
  id: string
  data: string
  status: string
  transportador_nome: string | null
  locais_carregamento: { nome: string } | null
  paradas: { quantidade_kg: number; quantidade_unidades: number | null; produto: string; clientes: { nome_propriedade: string } | null; pedidos: { status: string } | null }[]
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

type Props = {
  carregamentosIniciais: Carregamento[]
  pedidos: Pedido[]
  produtoCurto: Record<string, string>
  produtoEmbalagem: Record<string, { peso: number; unidade: string }>
  corFontePorNome: Record<string, string>
  ano: number
  mes: number
  diasNoMes: number
  primeiroDiaSemana: number
  hojeStr: string
  nomeMes: string
  mesAnteriorStr: string
  mesSeguinteStr: string
}


export default function CalendarioGrid({
  carregamentosIniciais,
  pedidos,
  produtoCurto,
  produtoEmbalagem,
  corFontePorNome,
  ano,
  mes,
  diasNoMes,
  primeiroDiaSemana,
  hojeStr,
  nomeMes,
  mesAnteriorStr,
  mesSeguinteStr,
}: Props) {
  const [carregamentos, setCarregamentos] = useState(carregamentosIniciais)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const dragCounters = useRef<Map<string, number>>(new Map())

  // Sincroniza o estado local quando o servidor envia dados atualizados
  useEffect(() => {
    setCarregamentos(carregamentosIniciais)
  }, [carregamentosIniciais])


  const diasArray = Array.from({ length: diasNoMes }, (_, i) => i + 1)
  const padding = Array.from({ length: primeiroDiaSemana })

  // Monta dayMap reativo ao estado local
  const dayMap = new Map<string, { carregamentos: Carregamento[]; pedidos: Pedido[] }>()
  for (let d = 1; d <= diasNoMes; d++) {
    const key = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dayMap.set(key, { carregamentos: [], pedidos: [] })
  }
  carregamentos.forEach(c => {
    const dateKey = c.data?.slice(0, 10)
    if (dateKey) dayMap.get(dateKey)?.carregamentos.push(c)
  })
  pedidos.forEach(p => {
    const dateKey = p.data_entrega_prevista?.slice(0, 10)
    if (dateKey) dayMap.get(dateKey)?.pedidos.push(p)
  })

  function handleDragStart(e: React.DragEvent, carregamentoId: string) {
    e.dataTransfer.setData('carregamento_id', carregamentoId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnter(e: React.DragEvent, date: string) {
    e.preventDefault()
    const count = (dragCounters.current.get(date) ?? 0) + 1
    dragCounters.current.set(date, count)
    setDragOverDate(date)
  }

  function handleDragLeave(_e: React.DragEvent, date: string) {
    const count = (dragCounters.current.get(date) ?? 1) - 1
    dragCounters.current.set(date, count)
    if (count <= 0) {
      dragCounters.current.delete(date)
      setDragOverDate(prev => prev === date ? null : prev)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, targetDate: string) {
    e.preventDefault()
    dragCounters.current.clear()
    setDragOverDate(null)

    const carregamentoId = e.dataTransfer.getData('carregamento_id')
    if (!carregamentoId) return

    const original = carregamentos.find(c => c.id === carregamentoId)
    if (!original || original.data === targetDate) return

    // Só permite mover para datas dentro do mês exibido
    if (!dayMap.has(targetDate)) return

    // Atualização otimista
    setCarregamentos(prev =>
      prev.map(c => c.id === carregamentoId ? { ...c, data: targetDate } : c)
    )

    // Persiste no servidor; reverte se falhar
    moverCarregamento(carregamentoId, targetDate).catch(() => {
      setCarregamentos(prev =>
        prev.map(c => c.id === carregamentoId ? { ...c, data: original.data } : c)
      )
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden select-none">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#193337]">
        <Link
          href={`/carregamentos?mes=${mesAnteriorStr}`}
          className="text-[#D2D82B] hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          ‹
        </Link>
        <span className="font-semibold text-white capitalize text-base">{nomeMes}</span>
        <Link
          href={`/carregamentos?mes=${mesSeguinteStr}`}
          className="text-[#D2D82B] hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          ›
        </Link>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid dos dias */}
      <div className="grid grid-cols-7 border-l border-gray-100">
        {padding.map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-gray-100 bg-gray-50/40" />
        ))}

        {diasArray.map(dia => {
          const key = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
          const dayData = dayMap.get(key)!
          const isHoje = key === hojeStr
          const col = (primeiroDiaSemana + dia - 1) % 7
          const isFimDeSemana = col === 0 || col === 6
          const isDragOver = dragOverDate === key

          return (
            <div
              key={key}
              onDragEnter={e => handleDragEnter(e, key)}
              onDragLeave={e => handleDragLeave(e, key)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, key)}
              className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 flex flex-col gap-0.5 transition-colors ${
                isDragOver
                  ? 'bg-[#D2D82B]/20 ring-2 ring-inset ring-[#D2D82B]'
                  : isHoje
                  ? 'bg-[#EAF5F5]'
                  : isFimDeSemana
                  ? 'bg-gray-50/60'
                  : ''
              }`}
            >
              {/* Número do dia */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isHoje
                      ? 'bg-[#D2D82B] text-[#193337]'
                      : isFimDeSemana
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}
                >
                  {dia}
                </span>
              </div>

              {/* Carregamentos — arrastáveis */}
              {dayData.carregamentos.map(c => {
                const paradas = c.paradas ?? []
                const kg = paradas.reduce((s, p) => s + (p.quantidade_kg || 0), 0)
                const statusPedidos = c.paradas.map(p => p.pedidos?.status).filter(Boolean) as string[]
                const temNfPendente = statusPedidos.some(s => s === 'aguardando_nf' || s === 'entregue')
                const temBoletoPendente = !temNfPendente && statusPedidos.some(s => s === 'aguardando_boleto')
                const todosFinalizado = statusPedidos.length > 0 && statusPedidos.every(s => s === 'finalizado')
                const bgColor =
                  c.status === 'rascunho' ? '#9ca3af' :
                  c.status === 'confirmado' ? '#3b82f6' :
                  c.status === 'em_rota' ? '#D2D82B' :
                  temNfPendente ? '#7c3aed' :
                  temBoletoPendente ? '#9333ea' :
                  todosFinalizado ? '#0d9488' :
                  '#49B171'
                const corFonte = corFontePorNome[c.locais_carregamento?.nome ?? '']
                const textColor = c.status === 'em_rota' ? '#193337' : corFonte || '#fff'

                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={e => handleDragStart(e, c.id)}
                    style={{ backgroundColor: bgColor, color: textColor }}
                    className="cursor-grab active:cursor-grabbing active:opacity-60 text-[10px] font-medium px-1.5 py-1 rounded leading-tight"
                  >
                    <Link
                      href={`/carregamentos/${c.id}`}
                      draggable={false}
                      className="block"
                    >
                      <div>🚛 {kg.toLocaleString('pt-BR')} kg</div>
                      {paradas.length === 1 && (
                        <>
                          <div className="truncate opacity-90">{paradas[0].clientes?.nome_propriedade}</div>
                          <div className="opacity-80">
                            {produtoCurto[paradas[0].produto] ?? paradas[0].produto}
                            {(() => {
                              const emb = produtoEmbalagem[paradas[0].produto]
                              if (!emb) return null
                              const qtd = paradas[0].quantidade_unidades != null
                                ? paradas[0].quantidade_unidades
                                : Math.round(paradas[0].quantidade_kg / emb.peso)
                              return ` · ${paradas[0].quantidade_unidades != null ? '' : '~'}${qtd.toLocaleString('pt-BR')} ${emb.unidade}s`
                            })()}
                          </div>
                        </>
                      )}
                      {paradas.length > 1 && (
                        <div className="opacity-85">
                          {paradas.length} clientes
                          {(() => {
                            // Agrupa unidades por produto (preferindo quantidade_unidades sobre cálculo)
                            const unidadesPorProduto = paradas.reduce<Record<string, { unidades: number | null; kg: number }>>((acc, p) => {
                              if (!acc[p.produto]) acc[p.produto] = { unidades: null, kg: 0 }
                              acc[p.produto].kg += p.quantidade_kg
                              if (p.quantidade_unidades != null) {
                                acc[p.produto].unidades = (acc[p.produto].unidades ?? 0) + p.quantidade_unidades
                              }
                              return acc
                            }, {})
                            const linhas = Object.entries(unidadesPorProduto)
                              .map(([prod, { unidades, kg }]) => {
                                const emb = produtoEmbalagem[prod]
                                if (!emb) return null
                                const qtd = unidades != null ? unidades : Math.round(kg / emb.peso)
                                return `${unidades != null ? '' : '~'}${qtd.toLocaleString('pt-BR')} ${emb.unidade}s`
                              })
                              .filter(Boolean)
                            return linhas.length > 0 ? ` · ${linhas.join(', ')}` : null
                          })()}
                        </div>
                      )}
                      {c.locais_carregamento?.nome && (
                        <div className="truncate opacity-80">📍 {c.locais_carregamento.nome}</div>
                      )}
                    </Link>
                  </div>
                )
              })}

              {/* Pedidos com entrega prevista — clique cria carregamento direto */}
              {dayData.pedidos.map(p => {
                const bgColor =
                  p.status === 'em_aberto' ? '#f59e0b' :
                  p.status === 'confirmado' ? '#3b82f6' :
                  p.status === 'aguardando_pesagem' ? '#3b82f6' :
                  p.status === 'aguardando_nf' ? '#7c3aed' :
                  p.status === 'aguardando_boleto' ? '#9333ea' :
                  p.status === 'finalizado' ? '#0d9488' :
                  '#49B171'
                const clienteNome = (p.clientes as { nome_propriedade: string } | null)?.nome_propriedade
                const localNome = (p.locais_carregamento as { nome: string } | null)?.nome

                return (
                  <form key={p.id} action={criarCarregamentoDoPedido.bind(null, p.id)}>
                    <button
                      type="submit"
                      style={{ backgroundColor: bgColor, color: '#fff' }}
                      className="w-full text-left text-[10px] font-medium px-1.5 py-1 rounded leading-tight cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <div className="truncate font-semibold">📦 {clienteNome}</div>
                      <div className="truncate opacity-90">
                        {produtoCurto[p.produto] ?? p.produto}
                        {(() => {
                          const emb = produtoEmbalagem[p.produto]
                          if (!emb) return ` · ${p.quantidade_kg.toLocaleString('pt-BR')} kg`
                          const qtd = p.quantidade_unidades != null
                            ? p.quantidade_unidades
                            : Math.round(p.quantidade_kg / emb.peso)
                          const aprox = p.quantidade_unidades == null ? '~' : ''
                          return ` · ${aprox}${qtd.toLocaleString('pt-BR')} ${emb.unidade}s`
                        })()}
                      </div>
                      {localNome && <div className="truncate opacity-80">📍 {localNome}</div>}
                    </button>
                  </form>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
