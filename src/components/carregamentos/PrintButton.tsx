'use client'

import { useEffect } from 'react'

export default function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 900)
    return () => clearTimeout(t)
  }, [])

  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed top-4 right-4 z-50 bg-[#193337] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg hover:bg-[#015046] transition-colors"
    >
      Imprimir / Salvar PDF
    </button>
  )
}
