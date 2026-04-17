'use client'

import { excluirPedido } from '@/lib/actions/pedidos'

export default function DeletePedidoButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm('Tem certeza que deseja apagar este pedido? Esta ação não pode ser desfeita.')) return
    await excluirPedido(id)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm px-4 py-2 border border-red-300 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors"
    >
      Apagar
    </button>
  )
}
