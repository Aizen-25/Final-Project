import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Map from './components/Map'
import Charts from './components/Charts'
import SmallMultiples from './components/SmallMultiples'
import agencies from './data/agencies.json'
import stationsData from './data/monitoring_stations.json'
import { useMemo } from 'react'

export default function App() {
  const [active, setActive] = useState('water')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [dashboardStation, setDashboardStation] = useState('')

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

  const defaultViewKey = Object.keys(stationsData)[0]
  const dashboardStations = useMemo(() => (stationsData[defaultViewKey] || []), [defaultViewKey])
  const stationOptions = dashboardStations.map((s) => `${s.Station} - ${s.Location}`)
  const latestMonths = ['Jan', 'Feb', 'Mar']
  const latestMonth = latestMonths[latestMonths.length - 1]
  const selectedStationObj = dashboardStation ? dashboardStations.find((s) => `${s.Station} - ${s.Location}` === dashboardStation) : null
  // station-specific values (when selected)
  const stationPH = selectedStationObj ? parseNumber(selectedStationObj.pH_units?.[latestMonth]) : null
  const stationDO = selectedStationObj ? parseNumber(selectedStationObj.DO_mgL?.[latestMonth]) : null
  const stationBOD = selectedStationObj ? parseNumber(selectedStationObj.BOD_mgL?.[latestMonth]) : null
  const stationFec = selectedStationObj ? parseNumber(selectedStationObj.FecalColiform_MPN_100mL?.[latestMonth]) : null
  // compute KPIs from real data (latest month)
  const _phVals = dashboardStations.map((s) => parseNumber(s.pH_units?.[latestMonth])).filter((v) => !Number.isNaN(v))
  const _doVals = dashboardStations.map((s) => parseNumber(s.DO_mgL?.[latestMonth])).filter((v) => !Number.isNaN(v))
  const _bodVals = dashboardStations.map((s) => parseNumber(s.BOD_mgL?.[latestMonth])).filter((v) => !Number.isNaN(v))
  const _fecVals = dashboardStations.map((s) => parseNumber(s.FecalColiform_MPN_100mL?.[latestMonth])).filter((v) => !Number.isNaN(v))
  const avgPH = _phVals.length ? +( _phVals.reduce((a,b) => a+b, 0) / _phVals.length ).toFixed(2) : null
  const avgDO = _doVals.length ? +( _doVals.reduce((a,b) => a+b, 0) / _doVals.length ).toFixed(2) : null
  const avgBOD = _bodVals.length ? +( _bodVals.reduce((a,b) => a+b, 0) / _bodVals.length ).toFixed(2) : null
  const maxFec = _fecVals.length ? Math.max(..._fecVals) : null

  return (
    <div className="app-bg min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: sidebarCollapsed ? '72px 1fr' : '248px 1fr' }}
        >
          {/* Sidebar (visible on all sizes) - parent controls collapsed width */}
          <div className="block">
            <Sidebar
              active={active}
              setActive={setActive}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
            />
          </div>

          <div className="pl-2 md:pl-6">
            <div className="header-bar">
              <div>
                <h1 className="text-2xl font-semibold">Laguna Lake Water Quality</h1>
                <p className="text-sm muted">Overview of parameters and locations</p>
              </div>
            </div>

            {active === 'dashboard' && (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm muted">Dashboard Filter:</label>
                  <select value={dashboardStation} onChange={(e) => setDashboardStation(e.target.value)} className="px-2 py-1 border rounded text-sm bg-white">
                    <option value="">All Stations</option>
                    {stationOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* (Infographics removed - reverted to previous layout) */}
                </div>
              )}
            {/* Station details block removed to keep header clean; KPIs show selected station */}

            {/* If user selected Map from the sidebar, show a full-width Laguna Lake map */}
            {active === 'map' ? (
              <div className="mt-6">
                <div className="card">
                  <div className="text-sm muted mb-2">Laguna de Bay</div>
                  <Map center={[14.25, 121.20]} zoom={10} height="520px" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {active !== 'water' && (
                    <div className="col-span-3 kpi-row">
                      <div className="kpi">
                        <div className="label muted">pH ({latestMonth})</div>
                        <div className="value mt-2">{selectedStationObj ? (isNaN(stationPH) ? '—' : stationPH) : (avgPH ?? '—')}</div>
                        <div className="status mt-1 muted">{selectedStationObj ? 'Selected station' : 'Average across stations'}</div>
                        <div className="range muted text-xs mt-1">Standard Range: 6.5 - 8.5</div>
                      </div>

                      <div className="kpi">
                        <div className="label muted">DO ({latestMonth})</div>
                        <div className="value mt-2">{selectedStationObj ? (isNaN(stationDO) ? '—' : stationDO + ' mg/L') : (avgDO ? `${avgDO} mg/L` : '—')}</div>
                        <div className="status mt-1 muted">{selectedStationObj ? 'Selected station' : 'Average across stations'}</div>
                        <div className="range muted text-xs mt-1">Recommended: ≥ 5 mg/L</div>
                      </div>

                      <div className="kpi">
                        <div className="label muted">Biochemical Oxygen Demand ({latestMonth})</div>
                        <div className="value mt-2">{selectedStationObj ? (isNaN(stationBOD) ? '—' : stationBOD + ' mg/L') : (avgBOD ? `${avgBOD} mg/L` : '—')}</div>
                        <div className="status mt-1 muted">{selectedStationObj ? 'Selected station' : 'Average across stations'}</div>
                        <div className="range muted text-xs mt-1">Lower is better (mg/L)</div>
                      </div>

                      <div className="kpi">
                        <div className="label muted">Fecal Coliform ({selectedStationObj ? latestMonth : 'max'})</div>
                        <div className="value mt-2">{selectedStationObj ? (isNaN(stationFec) ? '—' : stationFec) : (maxFec ?? '—')}</div>
                        <div className="status mt-1 muted">{selectedStationObj ? 'Selected station' : 'Highest reported'}</div>
                      </div>
                    </div>
                  )}

                  {/* removed Site Trends and Summary per request */}
                </div>

                {active === 'water' && (
                  <>
                
                    <div className="mt-6">
                      <div className="card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm muted">Site Trends</div>
                        </div>
                        <Charts showKPIs={false} showFilters={false} showStationFilter={true} selectedStation={dashboardStation} onStationChange={setDashboardStation} />
                        
                      </div>
                    </div>

                    <div className="mt-6">
                      <SmallMultiples />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
