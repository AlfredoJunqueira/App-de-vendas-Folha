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

const CORES = [
  '#193337',
  '#D2D82B',
  '#015046',
  '#6aada8',
  '#a8c5c2',
  '#8fae3a',
  '#2e5c62',
  '#e8ee7a',
]

interface Props {
  dados: Record<string, string | number>[]
  produtos: string[]
  produtoLabel: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, e: any) => s + (e.value as number), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: entry.fill }} />
            {entry.name}
          </span>
          <span className="font-medium text-gray-900 tabular-nums">{(entry.value as number).toFixed(1)} t</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex justify-between gap-4 pt-1.5 mt-1.5 border-t border-gray-100">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-gray-900 tabular-nums">{total.toFixed(1)} t</span>
        </div>
      )}
    </div>
  )
}

export default function GraficoVolumesProdutos({ dados, produtos, produtoLabel }: Props) {
  const temDados = dados.some(d => produtos.some(p => (d[p] as number) > 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="font-medium text-gray-900">Volume vendido por produto</h2>
        <p className="text-xs text-gray-500 mt-0.5">Últimos 12 meses — em toneladas</p>
      </div>

      {!temDados ? (
        <p className="text-sm text-gray-400 text-center py-10">Nenhum dado encontrado nos últimos 12 meses</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={dados} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}t`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {produtoLabel[value] ?? value}
                </span>
              )}
            />
            {produtos.map((prod, idx) => (
              <Bar
                key={prod}
                dataKey={prod}
                name={produtoLabel[prod] ?? prod}
                stackId="a"
                fill={CORES[idx % CORES.length]}
                radius={idx === produtos.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
