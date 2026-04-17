'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const CORES: Record<string, string> = {
  Fardos: '#193337',
  Bolas: '#D2D82B',
}
const COR_FALLBACK = ['#015046', '#49B171', '#86efac']

type Props = {
  data: ({ local: string } & Record<string, number>)[]
  tipos: string[]
  nomeMes: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[150px]">
      <p className="font-semibold text-gray-800 mb-2 leading-tight">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-medium text-gray-800">{p.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

export default function GraficoEmbalagens({ data, tipos, nomeMes }: Props) {
  // Se houver dois tipos com escalas muito diferentes, usa dois eixos Y
  const temDoisTipos = tipos.length >= 2

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-[#193337] mb-1 capitalize">
        Embalagens por local de carregamento — {nomeMes}
      </h2>
      {temDoisTipos && (
        <p className="text-xs text-gray-400 mb-4">
          Escalas independentes por tipo de embalagem
        </p>
      )}
      {!temDoisTipos && <div className="mb-4" />}
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 64)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: temDoisTipos ? 60 : 16, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid horizontal={false} stroke="#f0f0f0" />

          {/* Eixo X para o primeiro tipo (esquerda) */}
          <XAxis
            xAxisId="left"
            type="number"
            orientation="bottom"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
          />

          {/* Eixo X extra para o segundo tipo (direita) — só se tiver 2 tipos */}
          {temDoisTipos && (
            <XAxis
              xAxisId="right"
              type="number"
              orientation="top"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
            />
          )}

          <YAxis
            type="category"
            dataKey="local"
            width={130}
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 17) + '…' : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            iconSize={10}
            iconType="square"
          />

          {tipos.map((tipo, i) => (
            <Bar
              key={tipo}
              xAxisId={temDoisTipos && i === 1 ? 'right' : 'left'}
              dataKey={tipo}
              name={tipo}
              fill={CORES[tipo] ?? COR_FALLBACK[i % COR_FALLBACK.length]}
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
