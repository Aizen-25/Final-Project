import React, { useMemo, useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import stationsData from '../data/monitoring_stations.json'
import q4CsvRaw from '../data/water_quality_2024_Oct-Dec.csv?raw'

const QUARTER_TO_MONTHS = {
  Q1: ['Jan', 'Feb', 'Mar'],
  Q2: ['Apr', 'May', 'Jun'],
  Q3: ['Jul', 'Aug', 'Sep'],
  Q4: ['Oct', 'Nov', 'Dec'],
}

const METRICS = [
  { key: 'pH_units', label: 'pH', domain: [6, 9] },
  { key: 'DO_mgL', label: 'DO (mg/L)', domain: [0, 12] },
  { key: 'BOD_mgL', label: 'BOD (mg/L)', domain: null },
  { key: 'FecalColiform_MPN_100mL', label: 'Fecal Coliform', domain: null },
  { key: 'Chloride_mgL', label: 'Chloride (mg/L)', domain: null },
]

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
  const [metric, setMetric] = useState('pH_units')
  const [yearSel, setYearSel] = useState(null)
  const [quarterSel, setQuarterSel] = useState('Q1')

  // parse Q4 CSV
  const q4Parsed = useMemo(() => {
    try {
      const lines = (q4CsvRaw || '').trim().split(/\r?\n/)
      if (lines.length < 3) return null
      const rows = lines.slice(2).map(l => l.split(',').map(s => s.trim()))
      const base = stationsData.LagunaLakeStations_Q1_2024 || []
      const out = []
      rows.forEach((cols, idx) => {
        const stationBase = base[idx] || { Station: `R${idx+1}`, Location: '' }
        const obj = { Station: stationBase.Station, Location: stationBase.Location }
        const toNum = (v) => (v === '' || v === null ? null : (isNaN(Number(v)) ? v : Number(v)))
        function three(start) { return { Oct: toNum(cols[start]), Nov: toNum(cols[start+1]), Dec: toNum(cols[start+2]) } }
        obj.BOD_mgL = three(1)
        obj.DO_mgL = three(4)
        obj.FecalColiform_MPN_100mL = three(7)
        obj.Chloride_mgL = three(10)
        out.push(obj)
      })
      return out
    } catch (e) { return null }
  }, [])

  const combined = useMemo(() => ({ ...stationsData, ...(q4Parsed && q4Parsed.length ? { LagunaLakeStations_Q4_2024: q4Parsed } : {}) }), [q4Parsed])

  const views = useMemo(() => Object.keys(combined).map((k) => {
    const m = k.match(/Q(\d)_(\d{4})/)
    if (m) return { key: k, quarter: `Q${m[1]}`, year: m[2], months: QUARTER_TO_MONTHS[`Q${m[1]}`] || [] }
    return { key: k, quarter: null, year: null, months: [] }
  }), [combined])

  const years = useMemo(() => Array.from(new Set(views.map((v) => v.year).filter(Boolean))).sort(), [views])

  useEffect(() => { if (years.length && !yearSel) setYearSel(years[0]) }, [years, yearSel])

  const quartersForYear = useMemo(() => views.filter((v) => v.year === yearSel).map((v) => v.quarter), [views, yearSel])
  useEffect(() => { if (quartersForYear.length && !quarterSel) setQuarterSel(quartersForYear[0]) }, [quartersForYear, quarterSel])

  const selectedViewKey = useMemo(() => {
    const v = views.find((x) => x.year === yearSel && x.quarter === quarterSel)
    return v ? v.key : views[0]?.key
  }, [views, yearSel, quarterSel])

  const stations = combined[selectedViewKey] || []
  const months = useMemo(() => {
    const v = views.find((x) => x.key === selectedViewKey)
    return v?.months || []
  }, [selectedViewKey, views])

  const metricMeta = METRICS.find((m) => m.key === metric) || METRICS[0]

  const smallMultiples = useMemo(() => stations.map((s) => ({
    station: `${s.Station} - ${s.Location}`,
    data: months.map((m) => ({ month: m, value: parseNumber(s?.[metric]?.[m]) || null }))
  })), [stations, months, metric])

  // combined data: months -> { month, S_I: val, S_II: val, ... }
  const combinedSeries = useMemo(() => {
    const rows = months.map((m) => ({ month: m }))
    stations.forEach((s) => {
      const key = s.Station || `${s.Location}`
      months.forEach((m, idx) => {
        rows[idx][key] = parseNumber(s?.[metric]?.[m]) || null
      })
    })
    return rows
  }, [stations, months, metric])

  const [showCombined, setShowCombined] = useState(true)

  return (
    <div className="w-full rounded-md overflow-hidden bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm muted">Small multiples — {metricMeta.label} per station</div>
        <div className="flex items-center gap-2">
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="text-sm bg-white px-2 py-1 border rounded">
            {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <select value={yearSel || ''} onChange={(e) => { setYearSel(e.target.value); setQuarterSel(null) }} className="text-sm bg-white px-2 py-1 border rounded">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={quarterSel || ''} onChange={(e) => setQuarterSel(e.target.value)} className="text-sm bg-white px-2 py-1 border rounded">
            {quartersForYear.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>

      {showCombined && (
        <div className="mb-3">
          <div className="text-sm font-medium mb-2">All stations — {metricMeta.label} (lines)</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedSeries} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={metricMeta.domain || ['auto','auto']} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                {stations.map((s, i) => (
                  <Line key={s.Station} type="monotone" dataKey={s.Station} strokeWidth={1.5} dot={false} stroke={`hsl(${(i*40) % 360} 80% 45%)`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-right mt-1"><button className="text-xs text-slate-600" onClick={() => setShowCombined(false)}>Hide combined chart</button></div>
        </div>
      )}

      {!showCombined && (
        <div className="mb-3 text-right"><button className="text-xs text-slate-600" onClick={() => setShowCombined(true)}>Show combined chart</button></div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {smallMultiples.map((s) => (
          <div key={s.station} className="card">
            <div className="text-xs muted mb-1">{s.station}</div>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={s.data} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" hide />
                  <YAxis domain={metricMeta.domain || ['auto','auto']} hide />
                  <Line dataKey="value" stroke="var(--primary)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
