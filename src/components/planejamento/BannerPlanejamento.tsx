'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = {
  mesAtual: string        // "YYYY-MM"
  labelMes: string        // ex: "abril de 2026"
  temPlanejamentoSalvo: boolean
}

export default function BannerPlanejamento({ mesAtual, labelMes, temPlanejamentoSalvo }: Props) {
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    const hoje = new Date()
    const dia = hoje.getDate()

    // Só exibe entre o dia 1 e o dia 5 do mês
    if (dia < 1 || dia > 5) return

    // Só exibe se não houver planejamento salvo no servidor nem marcado no localStorage
    const chave = `planejamento_vendas_${mesAtual}`
    const jaFezLocalStorage = localStorage.getItem(chave) === '1'

    if (!temPlanejamentoSalvo && !jaFezLocalStorage) {
      setMostrar(true)
    }
  }, [mesAtual, temPlanejamentoSalvo])

  if (!mostrar) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-blue-900">
          Planejamento de vendas de <span className="capitalize">{labelMes}</span> não foi definido ainda.
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Defina as metas mensais por cliente e produto para acompanhar seu desempenho.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setMostrar(false)}
          className="text-xs text-blue-400 hover:text-blue-600 transition-colors"
        >
          Dispensar
        </button>
        <Link
          href="/planejamento"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Planejar agora
        </Link>
      </div>
    </div>
  )
}
