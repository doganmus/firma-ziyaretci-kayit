import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Visit = {
  id: string
  visitor_full_name: string
  visited_person_full_name: string
  company_name: string
  entry_at: string
  exit_at: string | null
  has_vehicle: boolean
  vehicle_plate: string | null
}

export default function VisitList() {
  const [items, setItems] = useState<Visit[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [company, setCompany] = useState('')
  const [hasVehicle, setHasVehicle] = useState<string>('') // '', 'true', 'false'
  const [plate, setPlate] = useState('')
  const [visitedPerson, setVisitedPerson] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo) params.dateTo = new Date(dateTo).toISOString()
      if (company) params.company = company
      if (hasVehicle) params.hasVehicle = hasVehicle
      if (plate) params.plate = plate
      if (visitedPerson) params.visitedPerson = visitedPerson
      const res = await api.get<Visit[]>('/visits', { params })
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exitVisit = async (id: string) => {
    await api.post(`/visits/${id}/exit`)
    await load()
  }

  const exportCsv = () => {
    const headers = ['Ad Soyad','Ziyaret Edilen','Firma','Giriş','Çıkış','Araç/Plaka']
    const rows = items.map(v => [
      v.visitor_full_name,
      v.visited_person_full_name,
      v.company_name,
      new Date(v.entry_at).toLocaleString(),
      v.exit_at ? new Date(v.exit_at).toLocaleString() : '-',
      v.has_vehicle ? (v.vehicle_plate ?? '') : 'PASİF',
    ])
    const csv = [headers, ...rows].map(r => r.map(x => `"${(x ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ziyaretler_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Ziyaretler</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
        <div>
          <label>Başlangıç</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label>Bitiş</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <label>Firma</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label>Araç</label>
          <select value={hasVehicle} onChange={(e) => setHasVehicle(e.target.value)}>
            <option value="">Tümü</option>
            <option value="true">Var</option>
            <option value="false">Yok</option>
          </select>
        </div>
        <div>
          <label>Plaka</label>
          <input value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>
        <div>
          <label>Ziyaret Edilen</label>
          <input value={visitedPerson} onChange={(e) => setVisitedPerson(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={load} disabled={loading}>{loading ? 'Yükleniyor...' : 'Filtrele'}</button>
        <button onClick={exportCsv} disabled={loading}>CSV İndir</button>
      </div>

      {loading ? <div>Yükleniyor...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Ziyaret Edilen</th>
              <th>Firma</th>
              <th>Giriş</th>
              <th>Çıkış</th>
              <th>Araç/Plaka</th>
              <th>Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td>{v.visitor_full_name}</td>
                <td>{v.visited_person_full_name}</td>
                <td>{v.company_name}</td>
                <td>{new Date(v.entry_at).toLocaleString()}</td>
                <td>{v.exit_at ? new Date(v.exit_at).toLocaleString() : '-'}</td>
                <td>{v.has_vehicle ? v.vehicle_plate : 'PASİF'}</td>
                <td>
                  {!v.exit_at && <button onClick={() => exitVisit(v.id)}>Çıkış Ver</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
