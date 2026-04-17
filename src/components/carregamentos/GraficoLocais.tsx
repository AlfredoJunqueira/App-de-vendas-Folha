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
  Cell,
} from 'recharts'

type Serie = { value: string; label: string }

type Props = {
  data: ({ local: string; total: number } & Record<string, number>)[]
  series: Serie[]
  nomeMes: string
}

const CORES = ['#015046', '#D2D82B', '#49B171', '#193337', '#86efac', '#a3e635']

function formatKg(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} t`
  return `${value} kg`
}

// Tooltip customizado
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-2 leading-tight">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600">{p.name}</span>
          </div>
          <span className="font-medium text-gray-800">{p.value.toLocaleString('pt-BR')} kg</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex justify-between pt-1.5 mt-1 border-t border-gray-100">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-gray-800">{total.toLocaleString('pt-BR')} kg</span>
        </div>
      )}
    </div>
  )
}

export default function GraficoLocais({ data, series, nomeMes }: Props) {
  const soloSeries = series.length === 1

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-[#193337] mb-4 capitalize">
        Volume por local de carregamento — {nomeMes}
      </h2>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 56)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tickFormatter={formatKg}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
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
          {!soloSeries && (
            <Legend
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              iconSize={10}
              iconType="square"
            />
          )}

          {soloSeries ? (
            <Bar dataKey={series[0].value} name={series[0].label} radius={[0, 4, 4, 0]} maxBarSize={32}>
              {data.map((_, i) => (
                <Cell key={i} fill={CORES[i % CORES.length]} />
              ))}
            </Bar>
          ) : (
            series.map((s, i) => (
              <Bar
                key={s.value}
                dataKey={s.value}
                name={s.label}
                stackId="a"
                fill={CORES[i % CORES.length]}
                radius={i === series.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                maxBarSize={32}
              />
            ))
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
