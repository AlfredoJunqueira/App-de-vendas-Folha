'use client'

import { useState } from 'react'

export interface PedidoItem {
  produto: string
  quantidade_unidades: string  // bolas/fardos — campo principal
  quantidade_kg: string        // estimado automaticamente ou manual
  preco_kg: string
}

interface ProdutoOpcao {
  value: string
  label: string
  peso_unitario_kg?: number | null
  unidade_embalagem?: string | null
}

interface Props {
  produtos: ProdutoOpcao[]
  initialItens?: PedidoItem[]
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function parseNum(s: string) {
  return parseFloat(s.replace(',', '.')) || 0
}

export default function PedidoItensEditor({ produtos, initialItens }: Props) {
  const defaultItem: PedidoItem = {
    produto: produtos[0]?.value ?? '',
    quantidade_unidades: '',
    quantidade_kg: '',
    preco_kg: '',
  }

  const [items, setItems] = useState<PedidoItem[]>(
    initialItens && initialItens.length > 0 ? initialItens : [defaultItem]
  )

  const produtoMap = Object.fromEntries(produtos.map(p => [p.value, p]))

  function addItem() {
    setItems(prev => [...prev, { ...defaultItem }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof PedidoItem, value: string) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }

      // Quando muda unidades, auto-estima kg com base no peso do produto
      if (field === 'quantidade_unidades' || field === 'produto') {
        const prod = produtoMap[field === 'produto' ? value : updated.produto]
        const unidades = parseNum(field === 'quantidade_unidades' ? value : updated.quantidade_unidades)
        if (prod?.peso_unitario_kg && unidades > 0) {
          updated.quantidade_kg = (unidades * prod.peso_unitario_kg).toFixed(0)
        }
      }

      return updated
    }))
  }

  const totalKg = items.reduce((s, i) => s + parseNum(i.quantidade_kg), 0)
  const totalBRL = items.reduce((s, i) => s + parseNum(i.quantidade_kg) * parseNum(i.preco_kg), 0)

  const itensJson = JSON.stringify(
    items.map(i => ({
      produto: i.produto,
      quantidade_unidades: parseNum(i.quantidade_unidades) || null,
      quantidade_kg: parseNum(i.quantidade_kg),
      preco_kg: parseNum(i.preco_kg),
    }))
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Produtos <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={addItem}
          className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
        >
          + Adicionar produto
        </button>
      </div>

      {/* Cabeçalho */}
      <div className="grid grid-cols-[1fr_90px_90px_90px_auto] gap-2 px-0.5">
        <p className="text-xs text-gray-500">Produto</p>
        <p className="text-xs text-gray-500">Unidades</p>
        <p className="text-xs text-gray-500">Qtd. (kg)</p>
        <p className="text-xs text-gray-500">R$/kg</p>
        <p className="text-xs text-gray-500 text-right pr-6">Subtotal</p>
      </div>

      {items.map((item, idx) => {
        const prod = produtoMap[item.produto]
        const temPeso = !!prod?.peso_unitario_kg
        const unidade = prod?.unidade_embalagem ?? 'un'
        const subtotal = parseNum(item.quantidade_kg) * parseNum(item.preco_kg)

        return (
          <div key={idx} className="space-y-1">
            <div className="grid grid-cols-[1fr_90px_90px_90px_auto] gap-2 items-center">
              <select
                value={item.produto}
                onChange={e => updateItem(idx, 'produto', e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {produtos.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              {/* Unidades */}
              <input
                type="number"
                value={item.quantidade_unidades}
                onChange={e => updateItem(idx, 'quantidade_unidades', e.target.value)}
                min="0"
                step="1"
                placeholder={temPeso ? unidade : '—'}
                disabled={!temPeso}
                title={temPeso ? `Quantidade em ${unidade}s` : 'Produto sem peso por unidade cadastrado'}
                className={`w-full px-2.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  temPeso ? 'border-gray-300' : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              />

              {/* kg — estimado se tiver unidades */}
              <div className="relative">
                <input
                  type="number"
                  value={item.quantidade_kg}
                  onChange={e => updateItem(idx, 'quantidade_kg', e.target.value)}
                  step="1"
                  min="0"
                  placeholder="0"
                  className={`w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    temPeso && item.quantidade_unidades ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                />
                {temPeso && item.quantidade_unidades && (
                  <span className="absolute -top-4 left-0 text-[10px] text-blue-500">estimado</span>
                )}
              </div>

              {/* R$/kg */}
              <input
                type="number"
                value={item.preco_kg}
                onChange={e => updateItem(idx, 'preco_kg', e.target.value)}
                step="0.0001"
                min="0"
                placeholder="0.0000"
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <div className="flex items-center gap-1 justify-end min-w-[90px]">
                <span className="text-sm text-gray-600 tabular-nums">{formatBRL(subtotal)}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    title="Remover"
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-base leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Dica de conversão */}
            {temPeso && item.quantidade_unidades && item.quantidade_kg && (
              <p className="text-[10px] text-blue-500 pl-0.5">
                ~{parseNum(item.quantidade_unidades).toLocaleString('pt-BR')} {unidade}s
                × {prod!.peso_unitario_kg} kg = {parseNum(item.quantidade_kg).toLocaleString('pt-BR')} kg estimados
              </p>
            )}
          </div>
        )
      })}

      {items.length > 1 && (
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Total: {totalKg.toLocaleString('pt-BR')} kg
          </span>
          <span className="text-sm font-semibold text-green-700">{formatBRL(totalBRL)}</span>
        </div>
      )}

      <input type="hidden" name="itens" value={itensJson} />
    </div>
  )
}
