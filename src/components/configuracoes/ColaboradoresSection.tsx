'use client'

import { useState } from 'react'
import { criarColaborador, excluirColaborador } from '@/lib/actions/colaboradores'

type Colaborador = { user_id: string; email: string }

export default function ColaboradoresSection({ colaboradores: inicial }: { colaboradores: Colaborador[] }) {
  const [colaboradores, setColaboradores] = useState(inicial)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCriar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const resultado = await criarColaborador(fd)
    setLoading(false)
    if (resultado.erro) {
      setErro(resultado.erro)
    } else {
      setSucesso('Colaborador criado com sucesso!')
      setMostrarForm(false)
      const email = fd.get('email') as string
      setColaboradores(prev => [...prev, { user_id: crypto.randomUUID(), email }])
      ;(e.target as HTMLFormElement).reset()
    }
  }

  async function handleExcluir(id: string, email: string) {
    if (!confirm(`Remover acesso de ${email}?`)) return
    const resultado = await excluirColaborador(id)
    if (resultado.erro) {
      setErro(resultado.erro)
    } else {
      setColaboradores(prev => prev.filter(c => c.user_id !== id))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-5">
      <h2 className="font-medium text-gray-900 mb-1">Colaboradores</h2>
      <p className="text-sm text-gray-500 mb-4">
        Colaboradores têm acesso somente ao calendário de carregamentos, sem permissão de edição.
      </p>

      {sucesso && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erro}
        </div>
      )}

      {colaboradores.length > 0 && (
        <div className="mb-4 space-y-2">
          {colaboradores.map(c => (
            <div key={c.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-sm text-gray-700">{c.email}</span>
              <button
                onClick={() => handleExcluir(c.user_id, c.email)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {mostrarForm ? (
        <form onSubmit={handleCriar} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#193337]"
              placeholder="colaborador@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial</label>
            <input
              name="senha"
              type="password"
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#193337]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#193337] hover:bg-[#015046] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar acesso'}
            </button>
            <button
              type="button"
              onClick={() => { setMostrarForm(false); setErro('') }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => { setMostrarForm(true); setSucesso(''); setErro('') }}
          className="text-sm px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          + Adicionar colaborador
        </button>
      )}
    </div>
  )
}
