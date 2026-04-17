'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  carregamentoId: string
  statusAtual: string
  token: string
}

export default function StatusButtons({ carregamentoId, statusAtual, token }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const proximoStatus = statusAtual === 'confirmado' ? 'em_rota'
    : statusAtual === 'em_rota' ? 'entregue'
    : null

  const btnLabel = proximoStatus === 'em_rota' ? '🚛 Sair em rota'
    : proximoStatus === 'entregue' ? '✅ Confirmar entrega'
    : null

  if (!btnLabel) return null

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/carregamento/${carregamentoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: proximoStatus, token }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-6">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-4 rounded-2xl text-white text-base font-semibold transition-colors ${
          proximoStatus === 'em_rota'
            ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300'
            : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
        }`}
      >
        {loading ? 'Atualizando...' : btnLabel}
      </button>
    </div>
  )
}
