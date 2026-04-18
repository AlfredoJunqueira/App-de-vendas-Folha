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

interface Props {
  dados: { mes: string; pedidos: number; clientes: number }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const pedidos = payload.find((e: any) => e.dataKey === 'pedidos')
  const clientes = payload.find((e: any) => e.dataKey === 'clientes')
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[150px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {pedidos && (
        <div className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0 bg-[#193337]" />
            Pedidos
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{pedidos.value}</span>
        </div>
      )}
      {clientes && (
        <div className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-[#D2D82B]" />
            Clientes
          </span>
          <span className="font-bold text-gray-900 tabular-nums">{clientes.value}</span>
        </div>
      )}
    </div>
  )
}

export default function GraficoClientesPedidos({ dados }: Props) {
  const temDados = dados.some(d => d.pedidos > 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h2 className="font-medium text-gray-900">Clientes atendidos e pedidos</h2>
        <p className="text-xs text-gray-500 mt-0.5">Últimos 12 meses</p>
      </div>

      {!temDados ? (
        <p className="text-sm text-gray-400 text-center py-10">Nenhum dado encontrado nos últimos 12 meses</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dados} margin={{ top: 4, right: 32, left: -16, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="pedidos"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="clientes"
              orientation="right"
              tick={{ fontSize: 10, fill: '#D2D82B' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Legend
              formatter={(value) => {
                if (value === 'clientes') return <span style={{ fontSize: 11, color: '#D2D82B' }}>Clientes atendidos</span>
                return <span style={{ fontSize: 11, color: '#6b7280' }}>Pedidos tirados</span>
              }}
            />
            <Bar
              yAxisId="pedidos"
              dataKey="pedidos"
              name="pedidos"
              fill="#193337"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="clientes"
              dataKey="clientes"
              name="clientes"
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
