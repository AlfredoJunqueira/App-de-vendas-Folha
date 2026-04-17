'use client'

import Link from 'next/link'

type Pedido = {
  id: string
  produto: string
  quantidade_kg: number
  preco_kg: number
  valor_total: number
  condicao_pagamento: string | null
  data_vencimento: string | null
  num_parcelas: number | null
  data_fechamento: string | null
  data_entrega_prevista: string | null
  observacoes: string | null
  clientes: {
    nome_propriedade: string
    contato: string | null
    telefone: string | null
    cidade: string | null
    estado: string | null
  } | null
  locais_carregamento: {
    nome: string
    cidade: string | null
    estado: string | null
  } | null
}

type Perfil = {
  nome?: string | null
  telefone?: string | null
  email?: string | null
  empresa?: string | null
  cnpj?: string | null
  inscricao_estadual?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
} | null

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(d + 'T12:00:00'))
}

const pagamentoLabel: Record<string, string> = {
  a_vista: 'À vista',
  a_prazo: 'A prazo',
  parcelado: 'Parcelado',
}

export default function OrcamentoView({
  pedido: p,
  produtoLabel,
  perfil,
}: {
  pedido: Pedido
  produtoLabel: Record<string, string>
  perfil: Perfil
}) {
  const cliente = p.clientes
  const local = p.locais_carregamento

  const dataOrcamento = p.data_fechamento
    ? formatDate(p.data_fechamento)
    : formatDate(new Date().toISOString().split('T')[0])

  function handlePrint() {
    window.print()
  }

  const pgLabel = p.condicao_pagamento ? pagamentoLabel[p.condicao_pagamento] : null
  const pgDetalhe = (() => {
    if (p.condicao_pagamento === 'a_prazo' && p.data_vencimento)
      return `Vencimento em ${formatDate(p.data_vencimento)}`
    if (p.condicao_pagamento === 'parcelado' && p.num_parcelas)
      return `${p.num_parcelas}x${p.data_vencimento ? ` — 1ª parcela em ${formatDate(p.data_vencimento)}` : ''}`
    return null
  })()

  return (
    <>
      {/* Barra de ações — some ao imprimir */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/pedidos/${p.id}`} className="text-sm text-gray-400 hover:text-gray-600">
            ← Voltar ao pedido
          </Link>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#015046,#193337)', boxShadow: '0 2px 8px rgba(1,80,70,.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 7H4a2 2 0 00-2 2v5a2 2 0 002 2h1v-4h10v4h1a2 2 0 002-2V9a2 2 0 00-2-2h-1"/>
            <path d="M5 14V4h10v10"/>
            <path d="M7 17h6"/>
          </svg>
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Documento */}
      <div
        id="orcamento-doc"
        className="bg-white mx-auto print:shadow-none"
        style={{
          maxWidth: '794px',
          minHeight: '1123px',
          boxShadow: '0 8px 40px rgba(25,51,55,.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          fontFamily: 'var(--font-outfit, system-ui, sans-serif)',
        }}
      >
        {/* ── CABEÇALHO ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f2225 0%,#193337 55%,#1a3a3f 100%)', padding: '0' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '110px' }}>

            {/* Lado esquerdo — logo + tagline */}
            <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                {/* Leaf icon */}
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(210,216,43,.15)', border: '1px solid rgba(210,216,43,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                    <path d="M8 13C8 13 2 10.5 2 5.5C2 3.5 4 2 6 2.5C7 2.75 8 3.5 8 3.5C8 3.5 9 2.75 10 2.5C12 2 14 3.5 14 5.5C14 10.5 8 13 8 13Z" fill="#D2D82B" opacity="0.9"/>
                    <line x1="8" y1="13" x2="8" y2="6" stroke="#193337" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#D2D82B', fontWeight: 700, letterSpacing: '0.2em', fontSize: '18px', lineHeight: 1 }}>FOLHA</div>
                  <div style={{ color: '#6a9a95', fontSize: '11px', letterSpacing: '0.05em', marginTop: '3px' }}>Feno e Pré-Secados</div>
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}>
                O campo em sua forma mais nutritiva
              </div>
            </div>

            {/* Faixa decorativa direita */}
            <div style={{ width: '200px', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 200 110" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMaxYMid slice">
                <defs>
                  <clipPath id="clip">
                    <rect width="200" height="110"/>
                  </clipPath>
                </defs>
                <g clipPath="url(#clip)">
                  <path d="M60 -20 Q100 30 60 80 Q30 110 80 130" fill="none" stroke="#D2D82B" strokeWidth="28" opacity="0.18"/>
                  <path d="M110 -10 Q150 40 110 90 Q80 120 130 140" fill="none" stroke="#D2D82B" strokeWidth="28" opacity="0.12"/>
                  <path d="M160 0 Q200 50 160 100 Q130 130 180 150" fill="none" stroke="#D2D82B" strokeWidth="28" opacity="0.08"/>
                </g>
              </svg>
              {/* Badge orçamento */}
              <div style={{ position: 'absolute', top: '20px', right: '24px', textAlign: 'right' }}>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Documento</div>
                <div style={{ color: '#D2D82B', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }}>Orçamento</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '2px' }}>{dataOrcamento}</div>
              </div>
            </div>
          </div>

          {/* Faixa lime fina */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg,#D2D82B 0%,rgba(210,216,43,0.3) 100%)' }} />
        </div>

        {/* ── CORPO ── */}
        <div style={{ padding: '36px 40px' }}>

          {/* Bloco de info: vendedor + cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>

            {/* Produtor / Local de carregamento */}
            <div style={{ background: '#f8fbfb', borderRadius: '10px', padding: '18px 20px', border: '1px solid #e2eceb' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#015046', textTransform: 'uppercase', marginBottom: '10px' }}>
                Produtor / Origem
              </div>
              {local ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111d1e', marginBottom: '4px' }}>{local.nome}</div>
                  {(local.cidade || local.estado) && (
                    <div style={{ fontSize: '11px', color: '#4a6366' }}>
                      {[local.cidade, local.estado].filter(Boolean).join(' — ')}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#8fa8a8', fontStyle: 'italic' }}>Não informado</div>
              )}
            </div>

            {/* Cliente */}
            <div style={{ background: '#f8fbfb', borderRadius: '10px', padding: '18px 20px', border: '1px solid #e2eceb' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#015046', textTransform: 'uppercase', marginBottom: '10px' }}>
                Cliente
              </div>
              {cliente ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111d1e', marginBottom: '4px' }}>{cliente.nome_propriedade}</div>
                  {(cliente.cidade || cliente.estado) && (
                    <div style={{ fontSize: '11px', color: '#4a6366', marginTop: '4px' }}>
                      {[cliente.cidade, cliente.estado].filter(Boolean).join(' — ')}
                    </div>
                  )}
                  {cliente.contato && <div style={{ fontSize: '11px', color: '#4a6366', marginTop: '4px' }}>Contato: {cliente.contato}</div>}
                  {cliente.telefone && <div style={{ fontSize: '11px', color: '#015046', fontWeight: 600 }}>{cliente.telefone}</div>}
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#8fa8a8', fontStyle: 'italic' }}>Não informado</div>
              )}
            </div>
          </div>

          {/* Tabela de itens */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: '#015046', textTransform: 'uppercase', marginBottom: '12px' }}>
              Itens do Orçamento
            </div>

            {/* Cabeçalho da tabela */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 110px 90px 110px 120px',
              background: '#193337',
              borderRadius: '8px 8px 0 0',
              padding: '10px 16px',
              gap: '8px',
            }}>
              {['Descrição', 'Quantidade', 'Unidade', 'Valor Unit.', 'Total'].map((h, i) => (
                <div key={h} style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: i === 4 ? '#D2D82B' : 'rgba(255,255,255,0.7)',
                  textAlign: i >= 1 ? 'center' : 'left',
                  textTransform: 'uppercase',
                }}>{h}</div>
              ))}
            </div>

            {/* Linha do item */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 110px 90px 110px 120px',
              background: '#ffffff',
              border: '1px solid #e2eceb',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '14px 16px',
              gap: '8px',
              alignItems: 'center',
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#111d1e' }}>
                {produtoLabel[p.produto] ?? p.produto}
              </div>
              <div style={{ fontSize: '13px', color: '#111d1e', textAlign: 'center', fontWeight: 500 }}>
                {p.quantidade_kg.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '13px', color: '#4a6366', textAlign: 'center' }}>kg</div>
              <div style={{ fontSize: '13px', color: '#111d1e', textAlign: 'center', fontWeight: 500 }}>
                {formatBRL(p.preco_kg)}
              </div>
              <div style={{ fontSize: '14px', color: '#015046', textAlign: 'center', fontWeight: 700 }}>
                {formatBRL(p.valor_total)}
              </div>
            </div>
          </div>

          {/* Total + Condições */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
            <div style={{ minWidth: '280px' }}>
              <div style={{
                background: 'linear-gradient(135deg,#015046,#193337)',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Valor Total
                </span>
                <span style={{ color: '#D2D82B', fontSize: '20px', fontWeight: 700 }}>
                  {formatBRL(p.valor_total)}
                </span>
              </div>

              {pgLabel && (
                <div style={{
                  marginTop: '8px',
                  background: '#f8fbfb',
                  border: '1px solid #e2eceb',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#015046', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Condição de Pagamento
                  </div>
                  <div style={{ fontSize: '13px', color: '#111d1e', fontWeight: 600 }}>{pgLabel}</div>
                  {pgDetalhe && <div style={{ fontSize: '11px', color: '#4a6366', marginTop: '2px' }}>{pgDetalhe}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Entrega prevista */}
          {p.data_entrega_prevista && (
            <div style={{
              background: 'rgba(73,177,113,0.08)',
              border: '1px solid rgba(73,177,113,0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#49B171" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="14" height="14" rx="2"/>
                <path d="M14 2v4M6 2v4M3 9h14"/>
              </svg>
              <div>
                <span style={{ fontSize: '11px', color: '#49B171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Entrega prevista:
                </span>
                <span style={{ fontSize: '13px', color: '#193337', fontWeight: 600, marginLeft: '6px' }}>
                  {formatDate(p.data_entrega_prevista)}
                </span>
              </div>
            </div>
          )}

          {/* Observações */}
          {p.observacoes && (
            <div style={{
              background: '#fffdf0',
              border: '1px solid #f0e68c',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#8a7a00', textTransform: 'uppercase', marginBottom: '6px' }}>
                Observações
              </div>
              <div style={{ fontSize: '12px', color: '#4a4020', lineHeight: 1.6 }}>{p.observacoes}</div>
            </div>
          )}
        </div>

        {/* ── RODAPÉ ── */}
        <div style={{
          background: '#193337',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: 'auto',
        }}>
          {/* Info empresa */}
          <div>
            {perfil?.empresa && (
              <div style={{ color: '#fff', fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>{perfil.empresa}</div>
            )}
            {(perfil?.cidade || perfil?.estado) && (
              <div style={{ color: '#6a9a95', fontSize: '11px' }}>
                {[perfil?.cidade, perfil?.estado].filter(Boolean).join(' — ')}
              </div>
            )}
            {perfil?.cnpj && <div style={{ color: '#6a9a95', fontSize: '11px' }}>CNPJ: {perfil.cnpj}</div>}
          </div>

          {/* Contatos */}
          <div style={{ textAlign: 'right' }}>
            {perfil?.nome && (
              <div style={{ color: '#D2D82B', fontSize: '12px', fontWeight: 700 }}>{perfil.nome}</div>
            )}
            {perfil?.telefone && (
              <div style={{ color: '#a8c5c0', fontSize: '11px' }}>{perfil.telefone}</div>
            )}
            {perfil?.email && (
              <div style={{ color: '#a8c5c0', fontSize: '11px' }}>{perfil.email}</div>
            )}
            {!perfil && (
              <div style={{ color: '#6a9a95', fontSize: '11px', fontStyle: 'italic' }}>
                Configure seu perfil para exibir contatos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          #orcamento-doc {
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .print\\:hidden { display: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </>
  )
}
