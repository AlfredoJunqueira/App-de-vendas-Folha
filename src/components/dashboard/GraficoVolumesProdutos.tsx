'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const CORES_BARRA = ['#193337', '#015046', '#2e5c62', '#6aada8', '#a8c5c2']

interface Props {
  titulo: string
  unidadeLabel: string
  dados: Record<string, string | number>[]
  produtos: string[]
  produtoLabel: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, unidadeLabel }: any) {
  if (!active || !payload?.length) return null
  const unEntry = payload.find((e: any) => e.dataKey === '_un')
  const barras = payload.filter((e: any) => e.dataKey !== '_un')
  const totalT = barras.reduce((s: number, e: any) => s + (e.value as number || 0), 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[170px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {barras.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: entry.fill }} />
            {entry.name}
          </span>
          <span className="font-medium text-gray-900 tabular-nums">{(entry.value as number || 0).toFixed(1)} t</span>
        </div>
      ))}
      {barras.length > 1 && (
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-gray-100">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{totalT.toFixed(1)} t</span>
        </div>
      )}
      {unEntry && (unEntry.value as number) > 0 && (
        <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-gray-100">
          <span className="text-[#D2D82B] font-medium">{unidadeLabel}</span>
          <span className="font-bold text-gray-900 tabular-nums">{unEntry.value}</span>
        </div>
      )}
    </div>
  )
}

export default function GraficoVolumesProdutos({ titulo, unidadeLabel, dados, produtos, produtoLabel }: Props) {
  const temDados = dados.some(d => produtos.some(p => (d[p] as number) > 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="font-medium text-gray-900">{titulo}</h2>
        <p className="text-xs text-gray-500 mt-0.5">Últimos 12 meses — toneladas e {unidadeLabel}</p>
      </div>

      {!temDados ? (
        <p className="text-sm text-gray-400 text-center py-10">Nenhum dado encontrado nos últimos 12 meses</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dados} margin={{ top: 4, right: 32, left: -16, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="kg"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}t`}
            />
            <YAxis
              yAxisId="un"
              orientation="right"
              tick={{ fontSize: 10, fill: '#D2D82B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => String(v)}
            />
            <Tooltip content={<CustomTooltip unidadeLabel={unidadeLabel} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend
              formatter={(value) => {
                if (value === '_un') return <span style={{ fontSize: 11, color: '#D2D82B' }}>{unidadeLabel}</span>
                return <span style={{ fontSize: 11, color: '#6b7280' }}>{produtoLabel[value] ?? value}</span>
              }}
            />
            {produtos.map((prod, idx) => (
              <Bar
                key={prod}
                yAxisId="kg"
                dataKey={prod}
                name={produtoLabel[prod] ?? prod}
                stackId="a"
                fill={CORES_BARRA[idx % CORES_BARRA.length]}
                radius={idx === produtos.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
            <Line
              yAxisId="un"
              dataKey="_un"
              name="_un"
              type="monotone"
              stroke="#D2D82B"
              strokeWidth={2}
              dot={{ r: 3, fill: '#D2D82B', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
