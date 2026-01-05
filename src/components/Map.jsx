import { MapContainer, TileLayer, Popup, useMap, GeoJSON, CircleMarker, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useState, useMemo, useEffect } from 'react'
import stationsFile from '../data/stations_with_coords.json'
import monitoringDataFile from '../data/monitoring_stations.json'
import lagunaBoundaryRaw from '../data/laguna_boundary.geojson?raw'
const lagunaBoundary = (() => {
  try { return JSON.parse(lagunaBoundaryRaw) } catch (e) { return null }
})()
import q4CsvRaw from '../data/water_quality_2024_Oct-Dec.csv?raw'

export default function Map({ center, zoom = 11, height = '420px' }) {
  const stations = stationsFile.stations || []

  // compute default center as average if not provided
  const defaultCenter = (() => {
    if (center && Array.isArray(center) && center.length === 2) return center
    if (!stations.length) return [14.25, 121.2]
    const lat = stations.reduce((s, x) => s + (x.lat || 0), 0) / stations.length
    const lon = stations.reduce((s, x) => s + (x.lon || 0), 0) / stations.length
    return [+(lat.toFixed(4)), +(lon.toFixed(4))]
  })()

  const [selected, setSelected] = useState('All')

  const options = useMemo(() => ['All', ...stations.map((s) => s.Station)], [stations])

  const selectedCoords = useMemo(() => {
    if (selected === 'All') return null
    const s = stations.find((x) => x.Station === selected)
    return s ? [s.lat, s.lon] : null
  }, [selected, stations])

  const visibleStations = useMemo(() => {
    if (selected === 'All') return stations
    return stations.filter((x) => x.Station === selected)
  }, [selected, stations])

  function MapCenterer({ coord }) {
    const map = useMap()
    useEffect(() => {
      if (!coord) return
      try {
        map.setView(coord, map.getZoom())
      } catch (e) {
        // ignore
      }
    }, [coord, map])
    return null
  }
  const [lagunaGeo, setLagunaGeo] = useState(null)
  const [showBoundary, setShowBoundary] = useState(true)
  const [tileKey, setTileKey] = useState('osm')
  const [metricKey, setMetricKey] = useState('pH_units')
  const [dataSource, setDataSource] = useState('Q1') // Q1 = bundled JSON, Q4 = CSV

  const TILE_SOURCES = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a','b','c']
    },
    satellite: {
      // Esri World Imagery
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    // terrain removed per user request
  }

  const METRIC_OPTIONS = [
    { key: 'pH_units', label: 'pH' },
    { key: 'DO_mgL', label: 'Dissolved O2 (mg/L)' },
    { key: 'BOD_mgL', label: 'Biochemical Oxygen Demand (BOD) (mg/L)' },
    { key: 'FecalColiform_MPN_100mL', label: 'Fecal Coliform (MPN/100mL)' },
    { key: 'Ammonia_mgL', label: 'Ammonia (mg/L)' },
    { key: 'Nitrate_mgL', label: 'Nitrate (mg/L)' },
    { key: 'Phosphate_mgL', label: 'Phosphate (mg/L)' },
    { key: 'TSS_mgL', label: 'TSS (mg/L)' }
  ]

  // helper to parse numbers like "<0.1" and strings
  function parseNumber(v) {
    if (v === null || v === undefined) return null
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const cleaned = v.trim().replace(/[<>]/g, '')
      const n = parseFloat(cleaned)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  // parse Q4 CSV into same shape as monitoring data
  const q4Data = useMemo(() => {
    try {
      const lines = (q4CsvRaw || '').trim().split(/\r?\n/)
      if (lines.length < 3) return null
      // header line 1: Row,BOD (mg/L),,,DO (mg/L),,,Fecal...,,
      // header line 2: ,Oct,Nov,Dec,Oct,Nov,Dec,Oct,Nov,Dec,Oct,Nov,Dec
      const rows = lines.slice(2).map(l => l.split(',').map(s => s.trim()))
      const base = monitoringDataFile.LagunaLakeStations_Q1_2024 || []
      const out = []
      rows.forEach((cols, idx) => {
        const stationBase = base[idx] || { Station: `R${idx+1}`, Location: '' }
        const obj = { Station: stationBase.Station, Location: stationBase.Location }
        function three(start) {
          const a = cols[start] === '' ? null : (isNaN(Number(cols[start])) ? cols[start] : Number(cols[start]))
          const b = cols[start+1] === '' ? null : (isNaN(Number(cols[start+1])) ? cols[start+1] : Number(cols[start+1]))
          const c = cols[start+2] === '' ? null : (isNaN(Number(cols[start+2])) ? cols[start+2] : Number(cols[start+2]))
          return { Oct: a, Nov: b, Dec: c }
        }
        obj.BOD_mgL = three(1)
        obj.DO_mgL = three(4)
        obj.FecalColiform_MPN_100mL = three(7)
        obj.Chloride_mgL = three(10)
        out.push(obj)
      })
      return out
    } catch (e) {
      return null
    }
  }, [q4CsvRaw])

  const selectedMonitoringList = useMemo(() => {
    return dataSource === 'Q1' ? (monitoringDataFile.LagunaLakeStations_Q1_2024 || []) : (q4Data || [])
  }, [dataSource, q4Data])

  // derive latest metric value per station (match by Station)
  const stationMetrics = useMemo(() => {
    const list = (selectedMonitoringList || []).map((s) => {
      // pick latest month available (Mar, Feb, Jan order)
      const months = ['Mar', 'Feb', 'Jan']
      const values = {}
      METRIC_OPTIONS.forEach((m) => {
        const obj = s[m.key]
        if (!obj) { values[m.key] = null; return }
        let v = null
        for (const mo of months) {
          if (obj[mo] !== undefined && obj[mo] !== null) { v = obj[mo]; break }
        }
        values[m.key] = parseNumber(v)
      })
      return { Station: s.Station, Location: s.Location, values }
    })
    // return as map by Station
    const map = {}
    list.forEach((s) => { map[s.Station] = s })
    return map
  }, [])

  // compute metric domain for current metricKey over stations that have coords
  const metricDomain = useMemo(() => {
    const vals = []
    const coordsStations = stations
    coordsStations.forEach((st) => {
      const m = stationMetrics[st.Station]
      if (!m) return
      const v = m.values[metricKey]
      if (v !== null && v !== undefined) vals.push(v)
    })
    if (!vals.length) return [0, 1]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    if (min === max) return [min, max + 1]
    return [min, max]
  }, [metricKey, stationMetrics, stations])

  function colorForValue(v) {
    if (v === null || v === undefined) return '#999999'
    const [min, max] = metricDomain
    const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
    // hue from green (120) to red (0)
    const hue = 120 - Math.round(120 * t)
    return `hsl(${hue} 80% 50%)`
  }

  function radiusForValue(v) {
    if (v === null || v === undefined) return 6
    const [min, max] = metricDomain
    const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
    return 6 + Math.round(12 * t) // 6..18
  }

  function createPinIcon(color) {
    const fill = '#1976d2' // standard map-pin blue
    const stroke = '#145ea8'
    const html = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 24 32">
        <path d="M12 0C8.13 0 5 3.13 5 7c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z" fill="${fill}" stroke="${stroke}" stroke-width="0.5"/>
        <circle cx="12" cy="8.5" r="2.5" fill="#ffffff"/>
      </svg>
    `
    return L.divIcon({ html, className: 'custom-pin', iconSize: [28, 36], iconAnchor: [14, 36] })
  }

  useEffect(() => {
    let cancelled = false
    async function fetchBoundary() {
      try {
        const res = await fetch('https://nominatim.openstreetmap.org/search.php?format=geojson&q=Laguna%20de%20Bay&polygon_geojson=1')
        if (!res.ok) {
          // fallback to bundled geojson
          if (!cancelled) setLagunaGeo(lagunaBoundary)
          return
        }
        const data = await res.json()
        if (cancelled) return
        // prefer the first feature (should be the lake)
        if (data && data.features && data.features.length) {
          setLagunaGeo(data)
        } else {
          // external source didn't return geometry; use bundled fallback
          setLagunaGeo(lagunaBoundary)
        }
      } catch (e) {
        // on fetch error, use bundled geojson so boundary still displays
        if (!cancelled) setLagunaGeo(lagunaBoundary)
      }
    }
    fetchBoundary()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="w-full rounded-md relative mb-6" style={{ height }}>
      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 65000 }} className="bg-white p-2 rounded shadow">
        <div className="flex items-center space-x-3">
            <label className="ml-1 text-lg flex items-center">
              <span className="sr-only">Data source</span>
              <select value={dataSource} onChange={(e) => setDataSource(e.target.value)} className="text-lg bg-white px-3 py-1.5 rounded">
                <option value="Q1">Q1 2024 (Jan–Mar)</option>
                <option value="Q4">Q4 2024 (Oct–Dec)</option>
              </select>
            </label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="text-lg bg-white px-3 py-1.5 rounded">
          {options.map((opt) => {
            if (opt === 'All') return <option key={opt} value={opt}>All stations</option>
            const s = stations.find((x) => x.Station === opt)
            return <option key={opt} value={opt}>{opt} — {s?.Location ?? ''}</option>
          })}
          </select>
          <label className="ml-1 text-lg flex items-center">
            <input type="checkbox" checked={showBoundary} onChange={(e) => setShowBoundary(e.target.checked)} className="mr-3 h-5 w-5" />
            <span>Boundary</span>
          </label>
          <label className="ml-1 text-lg flex items-center">
            <span className="sr-only">Map view</span>
            <select value={tileKey} onChange={(e) => setTileKey(e.target.value)} className="text-lg bg-white px-3 py-1.5 rounded">
              <option value="osm">Street</option>
              <option value="satellite">Satellite</option>
            </select>
          </label>
          <label className="ml-1 text-lg flex items-center">
            <span className="sr-only">Metric</span>
            <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} className="text-lg bg-white px-3 py-1.5 rounded">
              {METRIC_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </label>
        </div>
      </div>


      <MapContainer center={selectedCoords || defaultCenter} zoom={zoom} className="h-full w-full">
        {/* Laguna de Bay boundary overlay (authoritative from OSM) */}
        {lagunaGeo && showBoundary && <GeoJSON data={lagunaGeo} style={{ color: '#1e40af', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.08 }} />}
        <TileLayer
          attribution={TILE_SOURCES[tileKey].attribution}
          url={TILE_SOURCES[tileKey].url}
          subdomains={TILE_SOURCES[tileKey].subdomains}
        />

        {/* Graduated circle markers for selected metric */}
        {visibleStations.map((s) => {
          const meta = stationMetrics[s.Station]
          const val = meta ? meta.values[metricKey] : null
          const color = colorForValue(val)
          const radius = radiusForValue(val)
          const icon = createPinIcon(color)
          return ([
            <CircleMarker
              key={`${s.Station}-circle`}
              center={[s.lat, s.lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 1 }}
            />,
            <Marker key={`${s.Station}-pin`} position={[s.lat, s.lon]} icon={icon} zIndexOffset={1000}>
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{s.Station} — {s.Location}</div>
                  <div className="mt-1">{METRIC_OPTIONS.find(m => m.key===metricKey)?.label}: {val ?? 'n/a'}</div>
                </div>
              </Popup>
            </Marker>
          ])
        })}

        {/* Simple legend */}
        <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 65000, background: 'rgba(255,255,255,0.9)', transform: 'scale(1.5)', transformOrigin: 'left bottom', padding: '0.75rem' }} className="rounded shadow text-sm">
          <div className="font-medium">{METRIC_OPTIONS.find(m=>m.key===metricKey)?.label}</div>
          <div className="flex items-center space-x-2 mt-2">
            {(() => {
              const [min, max] = metricDomain
              const mid = (min + max) / 2
              const samples = [min, mid, max]
              return samples.map((v, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span style={{ width: 14, height: 14, background: colorForValue(v), display: 'inline-block', borderRadius: 3 }}></span>
                  <span className="text-xs">{v === null ? 'n/a' : (Number.isFinite(v) ? +v.toFixed(2) : v)}</span>
                </div>
              ))
            })()}
          </div>
        </div>

        {selectedCoords && <MapCenterer coord={selectedCoords} />}
      </MapContainer>

      {/* Data insight below the map explaining the legend */}
      <div className="mt-4 mb-6 text-sm text-gray-800">
        <div className="bg-white/90 p-3 rounded shadow text-sm" style={{ maxWidth: 760 }}>
          <div className="font-medium mb-1">Legend explanation</div>
          <div>Metric: {METRIC_OPTIONS.find(m => m.key === metricKey)?.label}</div>
          <div className="mt-1">Color: green → red shows the relative value (low → high) for the selected metric.</div>
          <div className="mt-1">Size: circle radius is proportional to the metric value (larger circle = larger value).</div>
          <div className="mt-1 text-xs text-gray-600">Range: {metricDomain[0]} — {metricDomain[1]}</div>
        </div>
      </div>
    </div>
  )
}
