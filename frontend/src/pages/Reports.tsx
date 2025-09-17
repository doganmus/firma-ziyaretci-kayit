import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Summary = { total: number; withVehicle: number; withoutVehicle: number; active: number; exited: number }

type ByCompany = { company: string; count: number }

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byCompany, setByCompany] = useState<ByCompany[]>([])

  const load = async () => {
    const params: any = {}
    if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString()
    if (dateTo) params.dateTo = new Date(dateTo).toISOString()
    const s = await api.get<Summary>('/reports/summary', { params })
    const c = await api.get<ByCompany[]>('/reports/by-company', { params })
    setSummary(s.data)
    setByCompany(c.data)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Raporlar</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div>
          <label>Başlangıç</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label>Bitiş</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button onClick={load}>Uygula</button>
      </div>

      {summary && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div>Toplam: <b>{summary.total}</b></div>
          <div>Araçlı: <b>{summary.withVehicle}</b></div>
          <div>Araçsız: <b>{summary.withoutVehicle}</b></div>
          <div>Aktif: <b>{summary.active}</b></div>
          <div>Çıkışlı: <b>{summary.exited}</b></div>
        </div>
      )}

      <h3>Firma Bazlı</h3>
      <table>
        <thead>
          <tr><th>Firma</th><th>Adet</th></tr>
        </thead>
        <tbody>
          {byCompany.map((r, i) => (
            <tr key={i}><td>{r.company}</td><td>{r.count}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
