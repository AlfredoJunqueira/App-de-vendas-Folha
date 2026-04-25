import { createClient } from '@/lib/supabase/server'
import { formatBRL, formatTon, formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import BannerPlanejamento from '@/components/planejamento/BannerPlanejamento'
import GraficoVolumesProdutos from '@/components/dashboard/GraficoVolumesProdutos'
import GraficoClientesPedidos from '@/components/dashboard/GraficoClientesPedidos'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hoje = new Date()
  const mesAtualStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const labelMesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje)

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
const inicio12Meses = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1).toISOString().split('T')[0]

  // Pedidos do mês (entregues ou confirmados)
  const { data: pedidosMes } = await supabase
    .from('pedidos')
    .select('quantidade_kg, valor_total, cliente_id, status')
    .eq('owner_id', user!.id)
    .gte('data_fechamento', inicioMes)
    .lte('data_fechamento', fimMes)
    .neq('status', 'cancelado')

  const totalToneladas = (pedidosMes?.reduce((s, p) => s + (p.quantidade_kg || 0), 0) ?? 0) / 1000
  const totalReceita = pedidosMes?.reduce((s, p) => s + (p.valor_total || 0), 0) ?? 0
  const pedidosAtivos = pedidosMes?.filter(p => p.status === 'em_aberto' || p.status === 'confirmado').length ?? 0
  const clientesAtendidos = new Set(pedidosMes?.map(p => p.cliente_id)).size

  // Histórico 12 meses — volume por produto separado por tipo de embalagem
  const [{ data: pedidosHistorico }, { data: produtosDb }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('quantidade_kg, quantidade_unidades, itens, produto, data_fechamento, cliente_id')
      .eq('owner_id', user!.id)
      .gte('data_fechamento', inicio12Meses)
      .neq('status', 'cancelado'),
    supabase
      .from('produtos')
      .select('value, label, unidade_embalagem, peso_unitario_kg')
      .eq('owner_id', user!.id),
  ])

  const produtoLabel: Record<string, string> = {}
  const produtoPeso: Record<string, number> = {}
  const produtoUnidade: Record<string, string> = {}
  for (const p of produtosDb ?? []) {
    produtoLabel[p.value] = p.label
    if (p.peso_unitario_kg) produtoPeso[p.value] = p.peso_unitario_kg
    if (p.unidade_embalagem) produtoUnidade[p.value] = p.unidade_embalagem
  }

  const prodIdsFardo = (produtosDb ?? []).filter(p => p.unidade_embalagem?.toLowerCase() === 'fardo').map(p => p.value)
  const prodIdsBola  = (produtosDb ?? []).filter(p => p.unidade_embalagem?.toLowerCase() === 'bola').map(p => p.value)

  // Mapas por mês: kg por produto + total de unidades
  const kgFardo:  Record<string, Record<string, number>> = {}
  const kgBola:   Record<string, Record<string, number>> = {}
  const unFardo:  Record<string, number> = {}
  const unBola:   Record<string, number> = {}

  type ItemHistorico = { produto: string; quantidade_kg: number; quantidade_unidades?: number | null }

  for (const pedido of pedidosHistorico ?? []) {
    const mes = pedido.data_fechamento?.slice(0, 7)
    if (!mes) continue

    const itens: ItemHistorico[] =
      Array.isArray(pedido.itens) && pedido.itens.length > 0
        ? pedido.itens
        : [{ produto: pedido.produto, quantidade_kg: pedido.quantidade_kg, quantidade_unidades: pedido.quantidade_unidades }]

    for (const item of itens) {
      const prod = item.produto || 'outros'
      const kg = (item.quantidade_kg ?? 0) / 1000
      const un = produtoPeso[prod]
        ? Math.round((item.quantidade_kg ?? 0) / produtoPeso[prod])
        : (item.quantidade_unidades ?? 0)

      if (prodIdsFardo.includes(prod)) {
        if (!kgFardo[mes]) kgFardo[mes] = {}
        kgFardo[mes][prod] = (kgFardo[mes][prod] ?? 0) + kg
        unFardo[mes] = (unFardo[mes] ?? 0) + un
      } else if (prodIdsBola.includes(prod)) {
        if (!kgBola[mes]) kgBola[mes] = {}
        kgBola[mes][prod] = (kgBola[mes][prod] ?? 0) + kg
        unBola[mes] = (unBola[mes] ?? 0) + un
      }
    }
  }

  // Clientes atendidos e pedidos por mês
  const pedidosPorMes: Record<string, number> = {}
  const clientesPorMes: Record<string, Set<string>> = {}
  for (const pedido of pedidosHistorico ?? []) {
    const mes = pedido.data_fechamento?.slice(0, 7)
    if (!mes) continue
    pedidosPorMes[mes] = (pedidosPorMes[mes] ?? 0) + 1
    if (pedido.cliente_id) {
      if (!clientesPorMes[mes]) clientesPorMes[mes] = new Set()
      clientesPorMes[mes].add(pedido.cliente_id)
    }
  }

  const dadosFardo: Record<string, string | number>[] = []
  const dadosBola:  Record<string, string | number>[] = []
  const dadosClientesPedidos: { mes: string; pedidos: number; clientes: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mesLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d)
    dadosFardo.push({ mes: mesLabel, _un: unFardo[mesKey] ?? 0, ...(kgFardo[mesKey] ?? {}) })
    dadosBola.push ({  mes: mesLabel, _un: unBola[mesKey]  ?? 0, ...(kgBola[mesKey]  ?? {}) })
    dadosClientesPedidos.push({
      mes: mesLabel,
      pedidos: pedidosPorMes[mesKey] ?? 0,
      clientes: clientesPorMes[mesKey]?.size ?? 0,
    })
  }

  // Verifica se já existe planejamento salvo para o mês atual
  const { data: planejamentoDoMes } = await supabase
    .from('planejamentos_mensais')
    .select('id')
    .eq('owner_id', user!.id)
    .eq('mes', mesAtualStr)
    .limit(1)
  const temPlanejamentoSalvo = (planejamentoDoMes?.length ?? 0) > 0



  return (
    <div className="space-y-6">
      <BannerPlanejamento
        mesAtual={mesAtualStr}
        labelMes={labelMesAtual}
        temPlanejamentoSalvo={temPlanejamentoSalvo}
      />

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Toneladas no mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalToneladas.toFixed(1)} t</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Receita no mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatBRL(totalReceita)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pedidos ativos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pedidosAtivos}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Clientes atendidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{clientesAtendidos}</p>
        </div>
      </div>

      {/* Gráfico clientes atendidos e pedidos */}
      <GraficoClientesPedidos dados={dadosClientesPedidos} />

      {/* Gráficos volume por tipo de produto */}
      <div className="grid md:grid-cols-2 gap-6">
        <GraficoVolumesProdutos
          titulo="Pré-Secados"
          unidadeLabel="bolas"
          dados={dadosBola}
          produtos={prodIdsBola}
          produtoLabel={produtoLabel}
        />
        <GraficoVolumesProdutos
          titulo="Fardos"
          unidadeLabel="fardos"
          dados={dadosFardo}
          produtos={prodIdsFardo}
          produtoLabel={produtoLabel}
        />
      </div>


    </div>
  )
}
