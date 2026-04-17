'use client'

import { useActionState, useState } from 'react'
import { criarLocal, atualizarLocal } from '@/lib/actions/locais'

type Produto = { value: string; label: string }

type Local = {
  id?: string
  nome?: string
  responsavel?: string
  telefone?: string
  cidade?: string
  estado?: string
  endereco?: string
  produto?: string
  capacidade_ton?: number
  observacoes?: string
  ativo?: boolean
  cor_fonte?: string | null
}

const COR_PRESETS = [
  { label: 'Padrão', value: '', bg: '#ffffff', ring: true },
  { label: 'Amarelo', value: '#D2D82B', bg: '#D2D82B' },
  { label: 'Âmbar', value: '#FCD34D', bg: '#FCD34D' },
  { label: 'Laranja', value: '#FB923C', bg: '#FB923C' },
  { label: 'Ciano', value: '#67E8F9', bg: '#67E8F9' },
  { label: 'Rosa', value: '#F9A8D4', bg: '#F9A8D4' },
]

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export default function LocalForm({ local, produtos }: { local?: Local; produtos: Produto[] }) {
  const isEditing = !!local?.id

  const action = isEditing
    ? atualizarLocal.bind(null, local!.id!)
    : criarLocal

  const [, formAction, pending] = useActionState(action as (state: unknown, payload: FormData) => unknown, null)

  const initialCor = local?.cor_fonte ?? ''
  const isCustom = initialCor !== '' && !COR_PRESETS.some(p => p.value === initialCor)
  const [corFonte, setCorFonte] = useState(initialCor)
  const [customColor, setCustomColor] = useState(isCustom ? initialCor : '#D2D82B')
  const [showCustom, setShowCustom] = useState(isCustom)

  return (
    <form action={formAction} className="space-y-5">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome do local <span className="text-red-500">*</span>
        </label>
        <input
          name="nome"
          required
          defaultValue={local?.nome}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          placeholder="Ex: Fazenda Boa Vista, Armazém Central..."
        />
      </div>

      {/* Responsável e Telefone */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
          <input
            name="responsavel"
            defaultValue={local?.responsavel}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
            placeholder="Nome do responsável"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
          <input
            name="telefone"
            type="tel"
            defaultValue={local?.telefone}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      {/* Endereço */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço / Localização</label>
        <input
          name="endereco"
          defaultValue={local?.endereco}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          placeholder="Rodovia, km, referências..."
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input
            name="cidade"
            defaultValue={local?.cidade}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            name="estado"
            defaultValue={local?.estado}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          >
            <option value="">UF</option>
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Produto e Capacidade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produto disponível</label>
          <select
            name="produto"
            defaultValue={local?.produto}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          >
            <option value="">Selecionar</option>
            {[...produtos, { value: 'ambos', label: 'Ambos' }].map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade estimada (toneladas)</label>
          <input
            name="capacidade_ton"
            type="number"
            step="0.01"
            min="0"
            defaultValue={local?.capacidade_ton}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Status (só na edição) */}
      {isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="ativo"
            defaultValue={local?.ativo !== false ? 'true' : 'false'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046]"
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      )}

      {/* Cor da fonte no calendário */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cor da fonte no calendário</label>
        <div className="flex flex-wrap items-center gap-2">
          {COR_PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => { setCorFonte(preset.value); setShowCustom(false) }}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: preset.bg,
                borderColor: corFonte === preset.value && !showCustom ? '#193337' : '#d1d5db',
                boxShadow: corFonte === preset.value && !showCustom ? '0 0 0 2px #193337' : undefined,
              }}
            />
          ))}
          {/* Personalizar */}
          <button
            type="button"
            title="Cor personalizada"
            onClick={() => { setShowCustom(true); setCorFonte(customColor) }}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all text-sm"
            style={{
              borderColor: showCustom ? '#193337' : '#d1d5db',
              boxShadow: showCustom ? '0 0 0 2px #193337' : undefined,
              background: showCustom ? customColor : '#f9fafb',
            }}
          >
            {!showCustom && '🎨'}
          </button>
          {showCustom && (
            <input
              type="color"
              value={customColor}
              onChange={e => { setCustomColor(e.target.value); setCorFonte(e.target.value) }}
              className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            />
          )}
          {corFonte !== '' && (
            <span
              className="text-xs px-2 py-1 rounded font-medium"
              style={{ backgroundColor: '#193337', color: corFonte }}
            >
              Prévia
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Define a cor do texto nos cards do calendário de carregamentos.</p>
        <input type="hidden" name="cor_fonte" value={corFonte} />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={local?.observacoes}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#015046] resize-none"
          placeholder="Informações adicionais, acesso, horários..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 md:flex-none px-6 py-2.5 bg-[#193337] hover:bg-[#015046] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {pending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar local'}
        </button>
        <a
          href={isEditing ? `/locais/${local!.id}` : '/locais'}
          className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
