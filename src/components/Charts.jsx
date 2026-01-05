import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useState, useMemo, useEffect } from 'react'
import stationsData from '../data/monitoring_stations.json'
import FilterBar from './FilterBarClean'

const QUARTER_TO_MONTHS = {
  Q1: ['Jan', 'Feb', 'Mar'],
  Q2: ['Apr', 'May', 'Jun'],
  Q3: ['Jul', 'Aug', 'Sep'],
  Q4: ['Oct', 'Nov', 'Dec'],
}

const METRICS = [
  { key: 'pH_units', label: 'pH', unit: '', domain: [6, 9] },
  { key: 'DO_mgL', label: 'Dissolved O2', unit: 'mg/L', domain: [0, 12] },
  { key: 'BOD_mgL', label: 'Biochemical Oxygen Demand (BOD)', unit: 'mg/L', domain: null },
  { key: 'FecalColiform_MPN_100mL', label: 'Fecal Coliform', unit: 'MPN/100mL', domain: null },
  { key: 'Ammonia_mgL', label: 'Ammonia', unit: 'mg/L', domain: null },
  { key: 'Nitrate_mgL', label: 'Nitrate', unit: 'mg/L', domain: null },
  { key: 'Phosphate_mgL', label: 'Phosphate', unit: 'mg/L', domain: null },
  { key: 'TSS_mgL', label: 'TSS', unit: 'mg/L', domain: null },
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

export default function Charts({ showKPIs = true, showFilters = true, showStationFilter = false, selectedStation: externalSelected = '', onStationChange }) {
  const views = useMemo(() => {
    return Object.keys(stationsData).map((k) => {
      const m = k.match(/Q(\d)_(\d{4})/)
      if (m) {
        const q = `Q${m[1]}`
        const y = m[2]
        return { key: k, quarter: q, year: y, months: QUARTER_TO_MONTHS[q] || [] }
      }
      return { key: k, quarter: null, year: null, months: [] }
    })
  }, [])

  const years = useMemo(() => Array.from(new Set(views.map((v) => v.year).filter(Boolean))).sort(), [views])
  const [yearSel, setYearSel] = useState(years[0] || null)
  const quartersForYear = useMemo(() => views.filter((v) => v.year === yearSel).map((v) => v.quarter), [views, yearSel])
  const [quarterSel, setQuarterSel] = useState(quartersForYear[0] || (views[0] && views[0].quarter) || null)
  const selectedViewKey = useMemo(() => {
    const v = views.find((x) => x.year === yearSel && x.quarter === quarterSel)
    return v ? v.key : views[0]?.key
  }, [views, yearSel, quarterSel])

  const stations = stationsData[selectedViewKey] || []
  const [selected, setSelected] = useState('')

  // Wrapper to update local selection and notify parent (if provided)
  const updateSelected = (val) => {
    setSelected(val)
    if (typeof onStationChange === 'function') onStationChange(val)
  }

  // sync external selected station (dashboard-level) into local state
  useEffect(() => {
    if (externalSelected !== undefined && externalSelected !== selected) setSelected(externalSelected)
  }, [externalSelected, selected])
  const stationOptions = useMemo(() => stations.map((s) => `${s.Station} - ${s.Location}`), [stations])

  // metric selection state
  const [metricSel, setMetricSel] = useState('pH_units')

  const months = useMemo(() => {
    const v = views.find((x) => x.key === selectedViewKey)
    return v?.months || []
  }, [selectedViewKey, views])

  const series = useMemo(() => {
    const rows = months.map((m) => ({ month: m }))
    if (!selected) {
      months.forEach((m, idx) => {
        let sum = 0, cnt = 0
        stations.forEach((s) => {
          const v = parseNumber(s?.[metricSel]?.[m] ?? s?.[metricSel])
          if (!Number.isNaN(v)) { sum += v; cnt++ }
        })
        rows[idx].value = cnt ? +(sum / cnt).toFixed(2) : null
      })
    } else {
      const key = selected.split(' - ')[0]
      const s = stations.find((x) => x.Station === key)
      months.forEach((m, idx) => {
        rows[idx].value = parseNumber(s?.[metricSel]?.[m]) || null
      })
    }
    return rows
  }, [selected, stations, months, metricSel])

  const kpis = useMemo(() => {
    const month = months[months.length - 1] || null
    if (!selected) {
      const phVals = stations.map((s) => parseNumber(s.pH_units?.[month])).filter((v) => !Number.isNaN(v))
      const doVals = stations.map((s) => parseNumber(s.DO_mgL?.[month])).filter((v) => !Number.isNaN(v))
      const fecVals = stations.map((s) => parseNumber(s.FecalColiform_MPN_100mL?.[month])).filter((v) => !Number.isNaN(v))
      const avgPH = phVals.length ? +(phVals.reduce((a,b)=>a+b,0)/phVals.length).toFixed(2) : null
      const avgDO = doVals.length ? +(doVals.reduce((a,b)=>a+b,0)/doVals.length).toFixed(2) : null
      const maxFec = fecVals.length ? Math.max(...fecVals) : null
      const minFec = fecVals.length ? Math.min(...fecVals) : null
      const meet = stations.filter((s) => {
        const p = parseNumber(s.pH_units?.[month]);
        const d = parseNumber(s.DO_mgL?.[month]);
        return !Number.isNaN(p) && !Number.isNaN(d) && p >= 6.5 && p <= 8.5 && d >= 5
      }).length
      const pct = stations.length ? Math.round((meet / stations.length) * 100) : 0
      return { avgPH, avgDO, maxFec, minFec, pct }
    } else {
      const key = selected.split(' - ')[0]
      const s = stations.find((x) => x.Station === key)
      const ph = parseNumber(s?.pH_units?.[month])
      const dov = parseNumber(s?.DO_mgL?.[month])
      const fec = parseNumber(s?.FecalColiform_MPN_100mL?.[month])
      const pct = (!Number.isNaN(ph) && !Number.isNaN(dov) && ph >=6.5 && ph <=8.5 && dov >=5) ? 100 : 0
      return { avgPH: ph || null, avgDO: dov || null, maxFec: fec || null, minFec: fec || null, pct }
    }
  }, [selected, stations, months])

  // build histogram data for the selected metric using the latest month
  const histogramData = useMemo(() => {
    const month = months[months.length - 1]
    const vals = stations.map((s) => parseNumber(s?.[metricSel]?.[month] ?? s?.[metricSel])).filter((v) => !Number.isNaN(v))
    if (!vals.length) return []
    const bins = 8
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    if (min === max) {
      return [{ bin: `${min}`, count: vals.length }]
    }
    const width = (max - min) / bins
    const counts = new Array(bins).fill(0)
    vals.forEach((v) => {
      let idx = Math.floor((v - min) / width)
      if (idx >= bins) idx = bins - 1
      if (idx < 0) idx = 0
      counts[idx]++
    })
    return counts.map((c, i) => {
      const lo = +(min + i * width).toFixed(2)
      const hi = +(min + (i + 1) * width).toFixed(2)
      return { bin: `${lo}–${hi}`, count: c }
    })
  }, [stations, months, metricSel])

  useEffect(() => {
    if (!quartersForYear || !quartersForYear.length) return
    if (!quarterSel || !quartersForYear.includes(quarterSel)) setQuarterSel(quartersForYear[0])
  }, [quartersForYear])

  const latestMonth = months[months.length - 1] || ''
  const metricMeta = METRICS.find((m) => m.key === metricSel) || METRICS[0]
  const viewChips = useMemo(() => views.filter((v) => v.year).map((v) => ({ key: v.key, label: `${v.quarter} ${v.year}`, year: v.year, quarter: v.quarter })), [views])

  const displayPeriod = (quarterSel && yearSel) ? `${quarterSel} ${yearSel}` : (views[0] ? `${views[0].quarter} ${views[0].year}` : 'All periods')
  const stationLabel = selected ? selected : 'All stations'
  const chartTitle = `${metricMeta.label}${metricMeta.unit ? ` (${metricMeta.unit})` : ''}`
  const chartSubtitle = selected ? `${stationLabel} • ${displayPeriod}` : `${displayPeriod} • Average across stations`

  return (
    <div className="w-full rounded-md overflow-hidden bg-white p-3 space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-800">{chartTitle}</div>
            <div className="text-xs text-slate-500 mt-0.5">{chartSubtitle}</div>
          </div>

          {(!showFilters && showStationFilter) && (
            <div className="ml-4 flex items-center gap-2">
              <select value={yearSel || ''} onChange={(e) => { setYearSel(e.target.value); setQuarterSel(null) }} className="px-2 py-1 border rounded text-sm bg-white">
                <option value="">All Years</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>

              <select value={selected || ''} onChange={(e) => updateSelected(e.target.value)} className="px-2 py-1 border rounded text-sm bg-white">
                <option value="">All Stations</option>
                {stationOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="mt-3">
            <FilterBar
              viewChips={viewChips}
              years={years}
              yearSel={yearSel}
              setYearSel={setYearSel}
              quarters={quartersForYear}
              quarterSel={quarterSel}
              setQuarterSel={setQuarterSel}
              stationOptions={stationOptions}
              selectedStation={selected}
              setSelectedStation={updateSelected}
              metricSel={metricSel}
              setMetricSel={setMetricSel}
              metrics={METRICS}
            />
          </div>
        )}
      </div>

      {showKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="kpi">
            <div className="label muted">Avg pH ({latestMonth})</div>
            <div className="value mt-2">{kpis.avgPH ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label muted">Avg DO ({latestMonth})</div>
            <div className="value mt-2">{kpis.avgDO ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label muted">Fecal Coliform (min / max)</div>
            <div className="value mt-2">{kpis.minFec ?? '—'} / {kpis.maxFec ?? '—'}</div>
          </div>
        </div>
      )}

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 18, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#334155' }} />
            <YAxis yAxisId="left" label={{ value: metricMeta.label + (metricMeta.unit ? ` (${metricMeta.unit})` : ''), angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 600, fill: '#0f172a' } }} domain={metricMeta.domain || ['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOD small chart retained */}
      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">Biochemical Oxygen Demand (mg/L) — {displayPeriod}</div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={(() => {
              const rows = months.map((m) => ({ month: m }))
              if (!selected) {
                months.forEach((m, idx) => {
                  let sum = 0, cnt = 0
                  stations.forEach((s) => {
                    const v = parseNumber(s.BOD_mgL?.[m])
                    if (!Number.isNaN(v)) { sum += v; cnt++ }
                  })
                  rows[idx].BOD = cnt ? +(sum / cnt).toFixed(2) : null
                })
              } else {
                const key = selected.split(' - ')[0]
                const s = stations.find((x) => x.Station === key)
                months.forEach((m, idx) => { rows[idx].BOD = parseNumber(s?.BOD_mgL?.[m]) || null })
              }
              return rows
            })()} margin={{ top: 8, right: 18, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 'dataMax']} />
              <Tooltip />
              <Line type="monotone" dataKey="BOD" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution histogram for selected metric (latest month) */}
      <div className="mt-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">Distribution — {metricMeta.label} ({latestMonth})</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 8, right: 18, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-slate-500 mt-2">Histogram of station values for the latest month; bins show value ranges and counts.</div>
      </div>
    </div>
  )
}
