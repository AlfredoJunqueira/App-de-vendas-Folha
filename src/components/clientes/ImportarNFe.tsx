'use client'

import { useRef, useState } from 'react'

type DadosNFe = {
  sucesso: boolean
  mensagem?: string
  nome?: string
  contato?: string
  telefone?: string
  cidade?: string
  estado?: string
  documento?: string
  tipo_documento?: string
  fonte?: string
}

type Props = {
  webhookUrl: string
  onDadosExtraidos: (dados: DadosNFe) => void
}

export default function ImportarNFe({ webhookUrl, onDadosExtraidos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'carregando' | 'sucesso' | 'erro'>('idle')
  const [mensagem, setMensagem] = useState('')

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    const ext = arquivo.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xml' && ext !== 'pdf') {
      setEstado('erro')
      setMensagem('Formato inválido. Envie um arquivo .xml (NF-e) ou .pdf (DANFE).')
      return
    }

    setEstado('carregando')
    setMensagem('')

    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)

      const res = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Servidor retornou ${res.status}`)
      }

      const dados: DadosNFe = await res.json()

      if (!dados.sucesso) {
        setEstado('erro')
        setMensagem(dados.mensagem || 'Não foi possível extrair os dados do documento.')
        return
      }

      setEstado('sucesso')
      setMensagem(`Dados extraídos do ${ext === 'xml' ? 'XML NF-e' : 'PDF'} com sucesso.`)
      onDadosExtraidos(dados)
    } catch (err) {
      setEstado('erro')
      setMensagem(err instanceof Error ? err.message : 'Erro ao conectar com o servidor de extração.')
    } finally {
      // Limpa o input para permitir reenvio do mesmo arquivo
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-blue-400 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900">Importar dados da NF-e</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Anexe o XML ou PDF da nota fiscal para preencher os campos automaticamente.
          </p>

          {estado === 'carregando' && (
            <p className="text-xs text-blue-700 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Extraindo dados do documento...
            </p>
          )}

          {estado === 'sucesso' && (
            <p className="text-xs text-green-700 mt-2">✓ {mensagem}</p>
          )}

          {estado === 'erro' && (
            <p className="text-xs text-red-600 mt-2">✗ {mensagem}</p>
          )}
        </div>
        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept=".xml,.pdf"
            className="hidden"
            onChange={handleArquivo}
            disabled={estado === 'carregando'}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={estado === 'carregando'}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {estado === 'carregando' ? 'Processando...' : 'Selecionar arquivo'}
          </button>
        </div>
      </div>
    </div>
  )
}
