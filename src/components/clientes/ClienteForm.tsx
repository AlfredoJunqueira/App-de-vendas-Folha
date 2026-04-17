'use client'

import { useActionState, useState } from 'react'
import { criarCliente, atualizarCliente } from '@/lib/actions/clientes'
import ImportarNFe from './ImportarNFe'

type Produto = { value: string; label: string }

type Cliente = {
  id?: string
  nome_propriedade?: string
  contato?: string
  telefone?: string
  cidade?: string
  estado?: string
  tipo_animal?: string
  num_cabecas?: number
  produto_preferido?: string
  volume_medio_ton?: number
  status?: string
  observacoes?: string
}

// URL do webhook n8n — troque por variável de ambiente em produção
const NFE_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_NFE_WEBHOOK ||
  'https://teste.agroagentes.com.br/webhook/nfe-extract'

export default function ClienteForm({ cliente, produtos }: { cliente?: Cliente; produtos: Produto[] }) {
  const isEditing = !!cliente?.id

  const action = isEditing
    ? atualizarCliente.bind(null, cliente!.id!)
    : criarCliente

  const [, formAction, pending] = useActionState(action as (state: unknown, payload: FormData) => unknown, null)

  // Campos controláveis pela importação NF-e
  const [nome, setNome] = useState(cliente?.nome_propriedade || '')
  const [contato, setContato] = useState(cliente?.contato || '')
  const [telefone, setTelefone] = useState(cliente?.telefone || '')
  const [cidade, setCidade] = useState(cliente?.cidade || '')
  const [estado, setEstado] = useState(cliente?.estado || '')

  const estados = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ]

  function handleDadosNFe(dados: {
    nome?: string; contato?: string; telefone?: string
    cidade?: string; estado?: string
  }) {
    if (dados.nome)     setNome(dados.nome)
    if (dados.contato)  setContato(dados.contato)
    if (dados.telefone) setTelefone(dados.telefone)
    if (dados.cidade)   setCidade(dados.cidade)
    if (dados.estado && estados.includes(dados.estado.toUpperCase())) {
      setEstado(dados.estado.toUpperCase())
    }
  }

  return (
    <form action={formAction} className="space-y-5">

      {/* Importar NF-e — só exibe se o webhook estiver configurado */}
      {NFE_WEBHOOK_URL && (
        <ImportarNFe
          webhookUrl={NFE_WEBHOOK_URL}
          onDadosExtraidos={handleDadosNFe}
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da propriedade <span className="text-red-500">*</span>
          </label>
          <input
            name="nome_propriedade"
            required
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Fazenda São João"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contato / Responsável <span className="text-red-500">*</span>
          </label>
          <input
            name="contato"
            required
            value={contato}
            onChange={e => setContato(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Nome do responsável"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
          <input
            name="telefone"
            type="tel"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              name="cidade"
              value={cidade}
              onChange={e => setCidade(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">UF</option>
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de animal</label>
          <select
            name="tipo_animal"
            defaultValue={cliente?.tipo_animal}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Selecionar</option>
            <option value="bovino">Bovino</option>
            <option value="equino">Equino</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de cabeças</label>
          <input
            name="num_cabecas"
            type="number"
            min="0"
            defaultValue={cliente?.num_cabecas}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produto preferido</label>
          <select
            name="produto_preferido"
            defaultValue={cliente?.produto_preferido}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Selecionar</option>
            {[...produtos, { value: 'ambos', label: 'Ambos' }].map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volume médio/mês (kg)
          </label>
          <input
            name="volume_medio_ton"
            type="number"
            step="0.01"
            min="0"
            defaultValue={cliente?.volume_medio_ton}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={cliente?.status || 'prospecto'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="prospecto">Prospecto</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={cliente?.observacoes}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Informações adicionais sobre o cliente..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {pending ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <a
          href={isEditing ? `/clientes/${cliente!.id}` : '/clientes'}
          className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
