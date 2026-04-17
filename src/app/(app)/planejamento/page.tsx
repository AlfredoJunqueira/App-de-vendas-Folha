import { createClient } from '@/lib/supabase/server'
import TabelaPlanejamento from '@/components/planejamento/TabelaPlanejamento'

export type MesInfo = {
  label: string   // ex: "dez/25"
  inicio: string  // ex: "2025-12-01"
  fim: string     // ex: "2025-12-31"
}

export type LinhaPlanejamento = {
  clienteId: string
  clienteNome: string
  isFirstRowOfGroup: boolean
  produto: string
  produtoLabel: string
  unidade: string
  volumes: [number, number, number, number]
  media: number
  tipoMix: 'principal' | 'ocasional'
  metaSugerida: number
  metaInicial: number
  planejamentoId?: string
}

function inicioMes(ano: number, mes: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-01`
}

function fimMes(ano: number, mes: number): string {
  return new Date(ano, mes + 1, 0).toISOString().split('T')[0]
}

function mesStr(ano: number, mes: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}`
}

export default async function PlanejamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() // 0-indexed

  const mesAtualStr = mesStr(anoAtual, mesAtual)

  // Calcula os 4 meses anteriores
  const meses: MesInfo[] = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(anoAtual, mesAtual - 4 + i, 1)
    const ano = d.getFullYear()
    const m = d.getMonth()
    return {
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d),
      inicio: inicioMes(ano, m),
      fim: fimMes(ano, m),
    }
  })

  const inicio4meses = meses[0].inicio
  const inicioMesAtualStr = inicioMes(anoAtual, mesAtual)

  // Busca paralela: clientes ativos, pedidos dos últimos 4 meses,
  // planejamentos do mês atual, produtos e pedidos recentes (60 dias)
  const limite60dias = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const [
    { data: clientes },
    { data: pedidosHistorico },
    { data: planejamentos },
    { data: produtosDb },
    { data: pedidosRecentes },
  ] = await Promise.all([
    supabase
      .from('clientes')
      .select('id, nome_propriedade')
      .eq('owner_id', user!.id)
      .eq('status', 'ativo')
      .order('nome_propriedade'),

    supabase
      .from('pedidos')
      .select('cliente_id, produto, quantidade_kg, data_fechamento')
      .eq('owner_id', user!.id)
      .neq('status', 'cancelado')
      .gte('data_fechamento', inicio4meses)
      .lt('data_fechamento', inicioMesAtualStr),

    supabase
      .from('planejamentos_mensais')
      .select('*')
      .eq('owner_id', user!.id)
      .eq('mes', mesAtualStr),

    supabase
      .from('produtos')
      .select('value, label, curto')
      .eq('owner_id', user!.id)
      .eq('ativo', true),

    supabase
      .from('pedidos')
      .select('cliente_id')
      .eq('owner_id', user!.id)
      .neq('status', 'cancelado')
      .gte('data_fechamento', limite60dias),
  ])

  // Mapa produto value → label
  const produtoLabels: Record<string, string> = {}
  for (const p of produtosDb ?? []) {
    produtoLabels[p.value] = p.label
  }

  // Clientes com compra recente (últimos 60 dias)
  const clientesComCompraRecente = new Set((pedidosRecentes ?? []).map(p => p.cliente_id))

  // Monta as linhas da tabela
  const linhas: LinhaPlanejamento[] = []

  for (const cliente of clientes ?? []) {
    const pedidosDoCliente = (pedidosHistorico ?? []).filter(p => p.cliente_id === cliente.id)

    // Produtos únicos comprados por este cliente nos últimos 4 meses
    const produtosUnicos = [...new Set(pedidosDoCliente.map(p => p.produto))]

    if (produtosUnicos.length === 0) continue

    const linhasDoCliente = produtosUnicos.map(produto => {
      const volumes: [number, number, number, number] = [0, 0, 0, 0]
      for (let i = 0; i < 4; i++) {
        const mes = meses[i]
        volumes[i] = pedidosDoCliente
          .filter(p => p.produto === produto && p.data_fechamento >= mes.inicio && p.data_fechamento <= mes.fim)
          .reduce((s: number, p: { quantidade_kg: number }) => s + (p.quantidade_kg || 0), 0)
      }

      const mesesComCompra = volumes.filter(v => v > 0).length
      const tipoMix: 'principal' | 'ocasional' = mesesComCompra >= 3 ? 'principal' : 'ocasional'
      const media = volumes.reduce((s, v) => s + v, 0) / 4
      const metaSugerida = Math.round(media * 1.1)

      const planejamento = (planejamentos ?? []).find(
        pl => pl.cliente_id === cliente.id && pl.produto === produto
      )

      return {
        clienteId: cliente.id,
        clienteNome: cliente.nome_propriedade,
        isFirstRowOfGroup: false,
        produto,
        produtoLabel: produtoLabels[produto] || produto,
        unidade: 'kg',
        volumes,
        media,
        tipoMix,
        metaSugerida,
        metaInicial: planejamento?.meta_volume ?? metaSugerida,
        planejamentoId: planejamento?.id,
      }
    })

    // Ordena: principal primeiro, ocasional depois
    linhasDoCliente.sort((a, b) => {
      if (a.tipoMix === b.tipoMix) return 0
      return a.tipoMix === 'principal' ? -1 : 1
    })

    linhasDoCliente[0].isFirstRowOfGroup = true
    linhas.push(...linhasDoCliente)
  }

  const labelMesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje)

  // Contagem de clientes sem compra recente (dos ativos)
  const totalClientesSemCompraRecente = (clientes ?? []).filter(
    c => !clientesComCompraRecente.has(c.id)
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Planejamento de Vendas</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{labelMesAtual}</p>
      </div>

      <TabelaPlanejamento
        linhas={linhas}
        meses={meses}
        mesAtual={mesAtualStr}
        totalClientesSemCompraRecente={totalClientesSemCompraRecente}
      />
    </div>
  )
}
