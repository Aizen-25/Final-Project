import React from 'react'

export default function FilterBarClean({
  years = [],
  yearSel,
  setYearSel,
  quarters = [],
  quarterSel,
  setQuarterSel,
  stationOptions = [],
  selectedStation,
  setSelectedStation,
  viewChips = [],
  metricSel,
  setMetricSel,
  metrics = [],
}) {
  return (
    <div className="w-full flex items-center gap-3 flex-nowrap overflow-x-auto">
      <div className="flex gap-2 flex-none">
        {viewChips.map((c) => (
          <button
            key={c.key}
            onClick={() => { setYearSel(c.year); setQuarterSel(c.quarter); }}
            className={`text-sm px-3 py-1 rounded-full border ${c.year === yearSel && c.quarter === quarterSel ? 'bg-primary text-white' : 'bg-white text-slate-700'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-md shadow-sm px-3 py-1 flex-none">
        <label className="text-xs text-slate-500 mr-2">Metric</label>
        <select value={metricSel || (metrics[0] && metrics[0].key)} onChange={(e) => setMetricSel(e.target.value)} className="text-sm bg-transparent outline-none">
          {metrics.length ? metrics.map((m) => <option key={m.key} value={m.key}>{m.label}{m.unit ? ` (${m.unit})` : ''}</option>) : (
            <>
              <option value="pH_units">pH</option>
              <option value="DO_mgL">DO (mg/L)</option>
            </>
          )}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-md shadow-sm px-3 py-1 flex-none">
        <label className="text-xs text-slate-500 mr-2">Year</label>
        <select
          value={yearSel || ''}
          onChange={(e) => { setYearSel(e.target.value); setQuarterSel(null) }}
          className="text-sm bg-transparent outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-md shadow-sm px-3 py-1 flex-none">
        <label className="text-xs text-slate-500 mr-2">Quarter</label>
        <select
          value={quarterSel || ''}
          onChange={(e) => setQuarterSel(e.target.value)}
          className="text-sm bg-transparent outline-none"
        >
          <option value="">All Quarters</option>
          {quarters.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative bg-white border rounded-md shadow-sm flex items-center px-3 py-1">
          <svg className="w-4 h-4 text-slate-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
          </svg>
          <input
            list="stations-list"
            placeholder="Filter by station (type or pick)..."
            className="w-full text-sm bg-transparent outline-none pr-6"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
          />
          <datalist id="stations-list">
            {stationOptions.map((s) => <option key={s} value={s} />)}
          </datalist>
          {selectedStation && (
            <button type="button" onClick={() => setSelectedStation('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
