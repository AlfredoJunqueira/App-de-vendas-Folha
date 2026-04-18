'use client'

import { useState } from 'react'
import { sincronizarTodosCarregamentos } from '@/lib/actions/carregamentos'

export default function SincronizarCalendarButton() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resultado, setResultado] = useState<{ ok: number; erros: number } | null>(null)

  async function handleClick() {
    setEstado('loading')
    try {
      const r = await sincronizarTodosCarregamentos()
      setResultado(r)
      setEstado('done')
    } catch {
      setEstado('error')
    }
  }

  return (
    <div className="mt-4">
      {estado === 'done' && resultado && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {resultado.ok} carregamento{resultado.ok !== 1 ? 's' : ''} sincronizado{resultado.ok !== 1 ? 's' : ''} com sucesso
          {resultado.erros > 0 && ` (${resultado.erros} com erro)`}.
        </div>
      )}
      {estado === 'error' && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Erro ao sincronizar. Tente novamente.
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={estado === 'loading'}
        className="text-sm px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {estado === 'loading' ? 'Sincronizando...' : 'Sincronizar carregamentos existentes'}
      </button>
    </div>
  )
}
