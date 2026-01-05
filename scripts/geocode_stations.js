import fs from 'fs/promises'

const inputPath = './Data/Water Monitoring station location.json'
const outPath = './src/data/stations_with_coords.json'

async function main(){
  const raw = await fs.readFile(inputPath, 'utf8')
  const data = JSON.parse(raw)
  const stations = data.LagunaLakeStations_Q1_2024 || []
  const results = []

  for (const s of stations) {
    const query = `${s.Location} Laguna de Bay Philippines`
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'final-project/1.0 (contact: you@example.com)' } })
      const arr = await res.json()
      if (arr && arr.length) {
        results.push({ station: s.Station, location: s.Location, lat: arr[0].lat, lon: arr[0].lon })
        console.log('Found:', s.Location, arr[0].lat, arr[0].lon)
      } else {
        results.push({ station: s.Station, location: s.Location, lat: null, lon: null })
        console.log('Not found:', s.Location)
      }
    } catch (err) {
      console.error('Error geocoding', s.Location, err.message)
      results.push({ station: s.Station, location: s.Location, lat: null, lon: null })
    }
    // Respect Nominatim usage policy: at most 1 request per second
    await new Promise((r) => setTimeout(r, 1100))
  }

  await fs.mkdir('./src/data', { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(results, null, 2))
  console.log('Wrote', outPath, 'rows:', results.length)
}

main().catch((e) => { console.error(e); process.exit(1) })
