import { useState, useMemo } from 'react'
import agencies from '../data/agencies.json'

export default function Agencies() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return agencies
    return agencies.filter((row) =>
      Object.values(row)
        .join(' ')
        .toLowerCase()
        .includes(s)
    )
  }, [q])

  return (
    <div>
      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search agencies or titles..."
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      <div style={{ maxHeight: '240px', overflow: 'auto' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pb-2">Agency</th>
              <th className="pb-2">Title</th>
              <th className="pb-2">Format</th>
              <th className="pb-2">Published</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">
                  <div className="font-semibold">{r.agency_abbrv || r.agency_name}</div>
                  <div className="text-xs muted">{r.agency_name}</div>
                </td>
                <td className="py-2">{r.title}</td>
                <td className="py-2">{r.file_format || '-'}</td>
                <td className="py-2">
                  {r.online_publication && r.location_or_url ? (
                    <a href={r.location_or_url} target="_blank" rel="noreferrer" className="text-blue-600">
                      Link
                    </a>
                  ) : (
                    r.online_publication || '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
