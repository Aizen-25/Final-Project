import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'
import stationsData from '../data/monitoring_stations.json'

const MONTHS = ['Jan', 'Feb', 'Mar']

function parseNumber(v) {
  if (v === null || v === undefined) return NaN
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    if (v.includes('<')) {
      const n = parseFloat(v.replace('<', '').trim())
      return isNaN(n) ? NaN : n / 2
    }
    const n = parseFloat(v)
    return isNaN(n) ? NaN : n
  }
  return NaN
}

export default function SmallMultiples() {
  const stations = (stationsData.LagunaLakeStations_Q1_2024 || [])

  const smallMultiples = useMemo(() => stations.map((s) => ({
    station: `${s.Station} - ${s.Location}`,
    data: MONTHS.map((m) => ({ month: m, pH: parseNumber(s.pH_units?.[m]) || null }))
  })), [stations])

  return (
    <div className="w-full rounded-md overflow-hidden bg-white p-3 space-y-3">
      <div className="text-sm muted mb-2">Small multiples — pH per station</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {smallMultiples.map((s) => (
          <div key={s.station} className="card">
            <div className="text-xs muted mb-1">{s.station}</div>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" hide />
                  <YAxis domain={[6, 9]} hide />
                  <Line dataKey="pH" stroke="var(--primary)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
