import { useState } from 'react'
import { api } from '../api/client'

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)[A-Z]{1,3}[0-9]{2,4}$/

export default function VisitForm() {
  const [visitorFullName, setVisitorFullName] = useState('')
  const [visitedPersonFullName, setVisitedPersonFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [hasVehicle, setHasVehicle] = useState(false)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!visitorFullName || !visitedPersonFullName || !companyName) {
      setMessage('Zorunlu alanlar eksik')
      return
    }
    try {
      setLoading(true)
      const now = new Date().toISOString()
      const normalizedPlate = vehiclePlate.replace(/\s+/g, '').toUpperCase()
      if (hasVehicle && !TR_PLATE_REGEX.test(normalizedPlate)) {
        setMessage('Plaka formatı geçersiz (örn. 34ABC1234)')
        return
      }
      await api.post('/visits', {
        entry_at: now,
        visitor_full_name: visitorFullName,
        visited_person_full_name: visitedPersonFullName,
        company_name: companyName,
        has_vehicle: hasVehicle,
        vehicle_plate: hasVehicle ? normalizedPlate : undefined,
      })
      setMessage('Kayıt oluşturuldu')
      setVisitorFullName('')
      setVisitedPersonFullName('')
      setCompanyName('')
      setHasVehicle(false)
      setVehiclePlate('')
    } catch (err) {
      setMessage('Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '24px auto' }}>
      <h2>Ziyaret Kaydı</h2>
      <form onSubmit={submit}>
        <div>
          <label>Adı Soyadı</label>
          <input value={visitorFullName} onChange={(e) => setVisitorFullName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Ziyaret Edilen Adı Soyadı</label>
          <input value={visitedPersonFullName} onChange={(e) => setVisitedPersonFullName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Firma</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Araç Var mı?</label>
          <input type="checkbox" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)} />
        </div>
        <div>
          <label>Plaka</label>
          <input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} disabled={!hasVehicle} placeholder={!hasVehicle ? 'PASİF' : ''} />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </form>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  )
}
