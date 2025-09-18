import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Table, Form, Input, Select, DatePicker, Button, Space, Typography, Popconfirm } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

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
  const [loading, setLoading] = useState(false)

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [company, setCompany] = useState('')
  const [hasVehicle, setHasVehicle] = useState<string>('')
  const [plate, setPlate] = useState('')
  const [visitedPerson, setVisitedPerson] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
      if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
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
      dayjs(v.entry_at).format('YYYY-MM-DD HH:mm'),
      v.exit_at ? dayjs(v.exit_at).format('YYYY-MM-DD HH:mm') : '-',
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

  const columns = useMemo(() => [
    { title: 'Ad Soyad', dataIndex: 'visitor_full_name', key: 'visitor_full_name' },
    { title: 'Ziyaret Edilen', dataIndex: 'visited_person_full_name', key: 'visited_person_full_name' },
    { title: 'Firma', dataIndex: 'company_name', key: 'company_name' },
    { title: 'Giriş', dataIndex: 'entry_at', key: 'entry_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: 'Çıkış', dataIndex: 'exit_at', key: 'exit_at', render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: 'Araç/Plaka', key: 'vehicle', render: (_: any, r: Visit) => r.has_vehicle ? (r.vehicle_plate ?? '') : 'PASİF' },
    {
      title: 'Aksiyon', key: 'action', render: (_: any, r: Visit) => (
        r.exit_at ? null : (
          <Popconfirm title="Çıkış verilsin mi?" onConfirm={() => exitVisit(r.id)}>
            <Button type="link">Çıkış Ver</Button>
          </Popconfirm>
        )
      )
    }
  ], [])

  return (
    <div style={{ padding: 16 }}>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>Ziyaretler</Typography.Title>

      <Form layout="inline" style={{ marginBottom: 12 }}>
        <Form.Item label="Tarih">
          <RangePicker allowEmpty={[true, true]} value={dateRange as any} onChange={(v) => setDateRange(v as any)} showTime={false} />
        </Form.Item>
        <Form.Item label="Firma">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} allowClear placeholder="Firma" />
        </Form.Item>
        <Form.Item label="Araç">
          <Select value={hasVehicle} onChange={setHasVehicle} style={{ width: 120 }} options={[
            { value: '', label: 'Tümü' },
            { value: 'true', label: 'Var' },
            { value: 'false', label: 'Yok' },
          ]} />
        </Form.Item>
        <Form.Item label="Plaka">
          <Input value={plate} onChange={(e) => setPlate(e.target.value)} allowClear placeholder="Plaka" />
        </Form.Item>
        <Form.Item label="Ziyaret Edilen">
          <Input value={visitedPerson} onChange={(e) => setVisitedPerson(e.target.value)} allowClear placeholder="Ad Soyad" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={load} loading={loading}>Filtrele</Button>
            <Button onClick={exportCsv} disabled={loading}>CSV İndir</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        rowKey="id"
        columns={columns as any}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
