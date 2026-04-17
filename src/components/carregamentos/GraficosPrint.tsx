'use client'

import {
  BarChart, Bar, XAxis, YAxis, Cell, Legend, ResponsiveContainer,
} from 'recharts'

type Serie = { value: string; label: string }

type Props = {
  graficoData: ({ local: string; total: number } & Record<string, number>)[]
  graficoSeries: Serie[]
  graficoEmbalagemData: ({ local: string } & Record<string, number>)[]
  tiposEmbalagem: string[]
  nomeMes: string
}

const CORES_VOL = ['#015046', '#D2D82B', '#49B171', '#193337', '#86efac', '#a3e635']
const CORES_EMB: Record<string, string> = { Fardos: '#193337', Bolas: '#D2D82B' }
const COR_FALLBACK = ['#015046', '#49B171', '#86efac']

const tickStyle = { fontSize: 7, fill: '#6b7280' }

function fmtKg(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}t` : String(v)
}
function truncate(v: string) {
  return v.length > 15 ? v.slice(0, 14) + '…' : v
}

export default function GraficosPrint({
  graficoData,
  graficoSeries,
  graficoEmbalagemData,
  tiposEmbalagem,
  nomeMes,
}: Props) {
  const hVol = Math.max(80, graficoData.length * 44)
  const hEmb = Math.max(80, graficoEmbalagemData.length * 44)

  return (
    <div className="flex flex-col gap-2 mb-2">

      {/* Gráfico de volume por local */}
      <div className="flex-1 border border-gray-200 rounded overflow-hidden">
        <div className="bg-[#193337] px-2 py-1">
          <p className="text-[7pt] font-semibold text-white capitalize">
            Volume por local — {nomeMes}
          </p>
        </div>
        <div style={{ height: hVol }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={graficoData}
              layout="vertical"
              margin={{ top: 4, right: 10, left: 0, bottom: 4 }}
            >
              <XAxis
                type="number"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtKg}
              />
              <YAxis
                type="category"
                dataKey="local"
                width={90}
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={truncate}
              />
              {graficoSeries.length > 1 && (
                <Legend
                  iconSize={7}
                  formatter={(v) => <span style={{ fontSize: '6pt', color: '#6b7280' }}>{v}</span>}
                />
              )}
              {graficoSeries.length === 1 ? (
                <Bar dataKey={graficoSeries[0].value} maxBarSize={18} radius={[0, 3, 3, 0]}>
                  {graficoData.map((_, i) => (
                    <Cell key={i} fill={CORES_VOL[i % CORES_VOL.length]} />
                  ))}
                </Bar>
              ) : (
                graficoSeries.map((s, i) => (
                  <Bar
                    key={s.value}
                    dataKey={s.value}
                    name={s.label}
                    stackId="a"
                    fill={CORES_VOL[i % CORES_VOL.length]}
                    maxBarSize={18}
                    radius={i === graficoSeries.length - 1 ? [0, 3, 3, 0] : [0, 0, 0, 0]}
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de embalagens por local */}
      <div className="flex-1 border border-gray-200 rounded overflow-hidden">
        <div className="bg-[#193337] px-2 py-1">
          <p className="text-[7pt] font-semibold text-white capitalize">
            Embalagens por local — {nomeMes}
          </p>
        </div>
        <div style={{ height: hEmb }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={graficoEmbalagemData}
              layout="vertical"
              margin={{ top: 4, right: 10, left: 0, bottom: 4 }}
              barGap={3}
            >
              <XAxis
                type="number"
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="local"
                width={90}
                tick={tickStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={truncate}
              />
              <Legend
                iconSize={7}
                formatter={(v) => <span style={{ fontSize: '6pt', color: '#6b7280' }}>{v}</span>}
              />
              {tiposEmbalagem.map((tipo, i) => (
                <Bar
                  key={tipo}
                  dataKey={tipo}
                  name={tipo}
                  fill={CORES_EMB[tipo] ?? COR_FALLBACK[i % COR_FALLBACK.length]}
                  radius={[0, 3, 3, 0]}
                  maxBarSize={18}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
