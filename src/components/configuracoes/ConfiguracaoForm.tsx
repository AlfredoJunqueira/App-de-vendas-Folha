'use client'

import { useRef, useState } from 'react'
import { salvarIdentidade, removerLogo, salvarPerfil } from '@/lib/actions/configuracoes'

interface Perfil {
  logo_url?: string | null
  nome_app?: string | null
  subtitulo_app?: string | null
  nome?: string | null
  empresa?: string | null
  telefone?: string | null
  email?: string | null
  cnpj?: string | null
  inscricao_estadual?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
}

export default function ConfiguracaoForm({ perfil }: { perfil: Perfil | null }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const currentLogo = preview ?? perfil?.logo_url ?? null

  return (
    <div className="space-y-6">

      {/* ── Identidade Visual ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Identidade Visual</h2>
        <form action={salvarIdentidade} className="space-y-5">

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Logo do aplicativo</label>

            {/* Preview + upload area */}
            <div className="flex items-start gap-4 flex-wrap">
              {/* Current logo preview */}
              <div
                className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 shrink-0"
                style={{ borderColor: currentLogo ? '#015046' : '#d1d5db' }}
              >
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                    <p className="text-[10px] text-gray-400">Sem logo</p>
                  </div>
                )}
              </div>

              {/* Drop zone */}
              <div
                className="flex-1 min-w-[180px] rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors"
                style={{
                  borderColor: dragging ? '#015046' : '#d1d5db',
                  background: dragging ? 'rgba(1,80,70,0.04)' : 'transparent',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragging(false)
                  const file = e.dataTransfer.files[0]
                  if (file) handleFile(file)
                }}
              >
                <p className="text-sm text-gray-600 font-medium">
                  {dragging ? 'Solte aqui' : 'Clique ou arraste uma imagem'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG ou WebP · Recomendado: 200×200px</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              name="logo"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />

            {/* Remove logo */}
            {perfil?.logo_url && !preview && (
              <form action={removerLogo} className="mt-2">
                <button
                  type="submit"
                  className="text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  Remover logo atual
                </button>
              </form>
            )}
            {preview && (
              <button
                type="button"
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              >
                Cancelar seleção
              </button>
            )}
          </div>

          {/* App name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do aplicativo</label>
              <input
                type="text"
                name="nome_app"
                defaultValue={perfil?.nome_app ?? ''}
                placeholder="Folha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Aparece no cabeçalho do app</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
              <input
                type="text"
                name="subtitulo_app"
                defaultValue={perfil?.subtitulo_app ?? ''}
                placeholder="Feno e Pré-Secados"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Descrição abaixo do nome</p>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: '#015046' }}
            >
              Salvar identidade visual
            </button>
          </div>
        </form>
      </section>

      {/* ── Dados do Representante ── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Dados do Representante</h2>
        <p className="text-sm text-gray-500 mb-5">Usados no rodapé dos orçamentos gerados pelo app.</p>

        <form action={salvarPerfil} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" name="nome" defaultValue={perfil?.nome ?? ''} placeholder="Seu nome"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input type="text" name="empresa" defaultValue={perfil?.empresa ?? ''} placeholder="Razão social"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="tel" name="telefone" defaultValue={perfil?.telefone ?? ''} placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" name="email" defaultValue={perfil?.email ?? ''} placeholder="seu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input type="text" name="cnpj" defaultValue={perfil?.cnpj ?? ''} placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
              <input type="text" name="inscricao_estadual" defaultValue={perfil?.inscricao_estadual ?? ''} placeholder="000.000.000.000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input type="text" name="endereco" defaultValue={perfil?.endereco ?? ''} placeholder="Rua, número, bairro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" name="cidade" defaultValue={perfil?.cidade ?? ''} placeholder="Cidade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input type="text" name="estado" maxLength={2} defaultValue={perfil?.estado ?? ''} placeholder="UF"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input type="text" name="cep" defaultValue={perfil?.cep ?? ''} placeholder="00000-000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: '#015046' }}
            >
              Salvar dados do representante
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
