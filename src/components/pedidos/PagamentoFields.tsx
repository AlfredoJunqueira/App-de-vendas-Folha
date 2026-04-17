'use client'

import { useState } from 'react'

type Props = {
  condicao?: string | null
  dataVencimento?: string | null
  numParcelas?: number | null
}

export default function PagamentoFields({ condicao, dataVencimento, numParcelas }: Props) {
  const [condicaoSelecionada, setCondicaoSelecionada] = useState(condicao ?? '')

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condição de pagamento</label>
        <select
          name="condicao_pagamento"
          value={condicaoSelecionada}
          onChange={e => setCondicaoSelecionada(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Não definido</option>
          <option value="a_vista">À vista</option>
          <option value="a_prazo">A prazo</option>
          <option value="parcelado">Parcelado</option>
        </select>
      </div>

      {(condicaoSelecionada === 'a_prazo' || condicaoSelecionada === 'parcelado') && (
        <div className={`grid gap-3 ${condicaoSelecionada === 'parcelado' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {condicaoSelecionada === 'parcelado' ? '1ª parcela' : 'Data de vencimento'}
            </label>
            <input
              type="date"
              name="data_vencimento"
              defaultValue={dataVencimento ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {condicaoSelecionada === 'parcelado' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de parcelas</label>
              <input
                type="number"
                name="num_parcelas"
                min="2"
                max="36"
                defaultValue={numParcelas ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 3"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
