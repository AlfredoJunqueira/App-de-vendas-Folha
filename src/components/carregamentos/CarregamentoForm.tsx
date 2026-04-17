'use client'

import { useState, useTransition } from 'react'
import { criarCarregamento, atualizarCarregamento } from '@/lib/actions/carregamentos'

type Cliente = { id: string; nome_propriedade: string; contato: string | null }
type Produto = { value: string; label: string }
type Local = { id: string; nome: string; cidade: string | null; estado: string | null }

type ParadaItem = {
  produto: string
  quantidade_kg: number
  quantidade_unidades: number | null
}

type Parada = {
  cliente_id: string
  itens: ParadaItem[]
  ordem: number
  observacoes: string
  pedido_id?: string | null
}

type Carregamento = {
  id?: string
  data?: string
  status?: string
  cliente_id?: string | null
  transportador_nome?: string
  transportador_telefone?: string
  transportador_placa?: string
  local_carregamento_id?: string | null
  paradas?: Parada[]
}

export default function CarregamentoForm({
  clientes,
  produtos,
  locais,
  carregamento,
}: {
  clientes: Cliente[]
  produtos: Produto[]
  locais: Local[]
  carregamento?: Carregamento
}) {
  const isEditing = !!carregamento?.id
  const [paradas, setParadas] = useState<Parada[]>(
    carregamento?.paradas ?? []
  )
  const [isPending, startTransition] = useTransition()

  const hoje = new Date().toISOString().split('T')[0]

  function addParada() {
    setParadas(prev => [
      ...prev,
      {
        cliente_id: '',
        itens: [{ produto: produtos[0]?.value ?? '', quantidade_kg: 0, quantidade_unidades: null }],
        ordem: prev.length + 1,
        observacoes: '',
      },
    ])
  }

  function removeParada(index: number) {
    setParadas(prev =>
      prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, ordem: i + 1 }))
    )
  }

  function moveParada(index: number, direction: 'up' | 'down') {
    const newParadas = [...paradas]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newParadas.length) return
    ;[newParadas[index], newParadas[swapIndex]] = [newParadas[swapIndex], newParadas[index]]
    setParadas(newParadas.map((p, i) => ({ ...p, ordem: i + 1 })))
  }

  function updateParada(index: number, field: 'cliente_id' | 'observacoes', value: string) {
    setParadas(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addItem(paradaIndex: number) {
    setParadas(prev => prev.map((p, i) =>
      i === paradaIndex
        ? { ...p, itens: [...p.itens, { produto: produtos[0]?.value ?? '', quantidade_kg: 0, quantidade_unidades: null }] }
        : p
    ))
  }

  function removeItem(paradaIndex: number, itemIndex: number) {
    setParadas(prev => prev.map((p, i) =>
      i === paradaIndex
        ? { ...p, itens: p.itens.filter((_, j) => j !== itemIndex) }
        : p
    ))
  }

  function updateItem(paradaIndex: number, itemIndex: number, field: keyof ParadaItem, value: string | number | null) {
    setParadas(prev => prev.map((p, i) =>
      i === paradaIndex
        ? {
            ...p,
            itens: p.itens.map((it, j) =>
              j === itemIndex ? { ...it, [field]: value } : it
            ),
          }
        : p
    ))
  }

  const totalKg = paradas.reduce((s, p) =>
    s + p.itens.reduce((si, it) => si + (Number(it.quantidade_kg) || 0), 0), 0
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('paradas', JSON.stringify(paradas.map(p => ({
      cliente_id: p.cliente_id,
      itens: p.itens.map(it => ({ ...it, quantidade_kg: Number(it.quantidade_kg) })),
      // campos legados: primeiro item + total kg
      produto: p.itens[0]?.produto ?? '',
      quantidade_kg: p.itens.reduce((s, it) => s + (Number(it.quantidade_kg) || 0), 0),
      ordem: p.ordem,
      observacoes: p.observacoes,
      pedido_id: p.pedido_id ?? null,
    }))))

    startTransition(() => {
      if (isEditing) {
        atualizarCarregamento(carregamento!.id!, formData)
      } else {
        criarCarregamento(formData)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data do carregamento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="data"
            required
            min="2000-01-01"
            max="2100-12-31"
            defaultValue={carregamento?.data || hoje}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select
            name="cliente_id"
            defaultValue={carregamento?.cliente_id ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Sem cliente definido</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome_propriedade}{c.contato ? ` — ${c.contato}` : ''}
              </option>
            ))}
          </select>
        </div>

        {locais.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local de carregamento</label>
            <select
              name="local_carregamento_id"
              defaultValue={carregamento?.local_carregamento_id ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Sem local definido</option>
              {locais.map(l => (
                <option key={l.id} value={l.id}>
                  {l.nome}{l.cidade ? ` — ${l.cidade}${l.estado ? `/${l.estado}` : ''}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={carregamento?.status || 'rascunho'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="rascunho">Rascunho</option>
              <option value="confirmado">Confirmado</option>
              <option value="em_rota">Em rota</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transportador</label>
          <input
            type="text"
            name="transportador_nome"
            defaultValue={carregamento?.transportador_nome}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Nome do motorista"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              name="transportador_telefone"
              defaultValue={carregamento?.transportador_telefone}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
            <input
              type="text"
              name="transportador_placa"
              defaultValue={carregamento?.transportador_placa}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
              placeholder="ABC-1234"
            />
          </div>
        </div>
      </div>

      {/* Paradas */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">
            Paradas
            {totalKg > 0 && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                — {(totalKg / 1000).toFixed(3)} t total
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={addParada}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + Adicionar parada
          </button>
        </div>

        {paradas.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhuma parada. Clique em &quot;Adicionar parada&quot; para começar.
          </p>
        )}

        <div className="space-y-4">
          {paradas.map((parada, i) => {
            const paradaKg = parada.itens.reduce((s, it) => s + (Number(it.quantidade_kg) || 0), 0)
            return (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Parada {i + 1}
                    {paradaKg > 0 && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">{(paradaKg / 1000).toFixed(3)} t</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveParada(i, 'up')}
                      disabled={i === 0}
                      className="px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveParada(i, 'down')}
                      disabled={i === paradas.length - 1}
                      className="px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeParada(i)}
                      className="px-2 py-1 text-red-400 hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Cliente */}
                <select
                  value={parada.cliente_id}
                  onChange={e => updateParada(i, 'cliente_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome_propriedade}</option>
                  ))}
                </select>

                {/* Itens (produtos) */}
                <div className="space-y-2">
                  {parada.itens.map((item, j) => (
                    <div key={j} className="grid grid-cols-[1fr_80px_90px_28px] gap-2 items-center">
                      <select
                        value={item.produto}
                        onChange={e => updateItem(i, j, 'produto', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {produtos.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantidade_unidades ?? ''}
                        onChange={e => updateItem(i, j, 'quantidade_unidades', e.target.value === '' ? null : Number(e.target.value))}
                        min="0"
                        step="1"
                        placeholder="Un."
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        value={item.quantidade_kg || ''}
                        onChange={e => updateItem(i, j, 'quantidade_kg', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        placeholder="kg"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {parada.itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i, j)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addItem(i)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  + Adicionar produto
                </button>

                <input
                  type="text"
                  value={parada.observacoes}
                  onChange={e => updateParada(i, 'observacoes', e.target.value)}
                  placeholder="Observações (ex: entregar no galpão 2)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar carregamento'}
        </button>
        <a
          href={isEditing ? `/carregamentos/${carregamento!.id}` : '/carregamentos'}
          className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
