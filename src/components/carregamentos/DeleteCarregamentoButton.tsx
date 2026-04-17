'use client'

import { excluirCarregamento } from '@/lib/actions/carregamentos'

export default function DeleteCarregamentoButton({ id, mes }: { id: string; mes?: string }) {
  async function handleDelete() {
    if (!confirm('Tem certeza que deseja apagar este carregamento? Esta ação não pode ser desfeita.')) return
    const fd = new FormData()
    if (mes) fd.set('mes', mes)
    await excluirCarregamento(id, fd)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm px-4 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors"
    >
      Apagar
    </button>
  )
}
