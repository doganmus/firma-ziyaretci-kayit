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

  const load = async () => {
    const res = await api.get<Visit[]>('/visits')
    setItems(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  const exitVisit = async (id: string) => {
    await api.post(`/visits/${id}/exit`)
    await load()
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Ziyaretler</h2>
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
    </div>
  )
}
