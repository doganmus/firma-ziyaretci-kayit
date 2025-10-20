import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Table, Form, Input, Select, DatePicker, Button, Space, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

// Type for a visit item as returned by the API
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
  const [maintenance, setMaintenance] = useState(false)
  useEffect(() => {
    ;(async () => {
      try {
        const s = await api.get('/settings/public')
        setMaintenance(!!s.data.maintenanceMode)
      } catch {}
    })()
  }, [])
  const [items, setItems] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // Filter states bound to the form controls
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [company, setCompany] = useState('')
  const [hasVehicle, setHasVehicle] = useState<string>('')
  const [plate, setPlate] = useState('')
  const [visitedPerson, setVisitedPerson] = useState('')

  // Loads visit data from the API using filters
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
      if (sortKey) params.sortKey = sortKey
      if (sortOrder) params.sortOrder = sortOrder === 'ascend' ? 'asc' : 'desc'
      params.page = page
      params.pageSize = pageSize
      const res = await api.get<{ data: Visit[]; total: number }>('/visits', { params })
      setItems(res.data.data)
      setTotal(res.data.total)
    } catch {
      setItems([])
      setTotal(0)
      message.error('Kayıtlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calls the API to set exit time for a visit
  const exitVisit = async (id: string) => {
    await api.post(`/visits/${id}/exit`)
    await load()
  }

  // Export the table to a simple Excel-compatible XML format
  const exportExcel = () => {
    const headers = ['Ad Soyad','Ziyaret Edilen','Firma','Giriş','Çıkış','Araç/Plaka']
    const rows = items.map(v => [
      v.visitor_full_name,
      v.visited_person_full_name,
      v.company_name,
      dayjs(v.entry_at).format('YYYY-MM-DD HH:mm'),
      v.exit_at ? dayjs(v.exit_at).format('YYYY-MM-DD HH:mm') : '-',
      v.has_vehicle ? (v.vehicle_plate ?? '') : '',
    ])

    const worksheet = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Ziyaretler"><Table>${[headers, ...rows]
      .map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${(c ?? '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`).join('')}</Row>`)
      .join('')}</Table></Worksheet></Workbook>`

    const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ziyaretler_${Date.now()}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Role-based UI: viewers cannot exit visits
  const role = (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? (JSON.parse(u).role as string) : null
    } catch {
      return null
    }
  })()
  const isViewer = role === 'VIEWER'

  // Table columns with optional exit action and dynamic sorting
  const columns = useMemo(() => {
    const base: any[] = [
      {
        title: <span aria-sort={sortKey === 'visitor_full_name' ? (sortOrder || 'none') : 'none'}>Ad Soyad</span>,
        dataIndex: 'visitor_full_name',
        key: 'visitor_full_name',
        sorter: (a: Visit, b: Visit) => a.visitor_full_name.localeCompare(b.visitor_full_name),
        sortOrder: sortKey === 'visitor_full_name' ? sortOrder : null,
      },
      {
        title: <span aria-sort={sortKey === 'visited_person_full_name' ? (sortOrder || 'none') : 'none'}>Ziyaret Edilen</span>,
        dataIndex: 'visited_person_full_name',
        key: 'visited_person_full_name',
        sorter: (a: Visit, b: Visit) => a.visited_person_full_name.localeCompare(b.visited_person_full_name),
        sortOrder: sortKey === 'visited_person_full_name' ? sortOrder : null,
      },
      {
        title: <span aria-sort={sortKey === 'company_name' ? (sortOrder || 'none') : 'none'}>Firma</span>,
        dataIndex: 'company_name',
        key: 'company_name',
        sorter: (a: Visit, b: Visit) => a.company_name.localeCompare(b.company_name),
        sortOrder: sortKey === 'company_name' ? sortOrder : null,
      },
      {
        title: <span aria-sort={sortKey === 'entry_at' ? (sortOrder || 'none') : 'none'}>Giriş</span>,
        dataIndex: 'entry_at',
        key: 'entry_at',
        render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
        sorter: (a: Visit, b: Visit) => dayjs(a.entry_at).valueOf() - dayjs(b.entry_at).valueOf(),
        sortOrder: sortKey === 'entry_at' ? sortOrder : null,
      },
      {
        title: <span aria-sort={sortKey === 'exit_at' ? (sortOrder || 'none') : 'none'}>Çıkış</span>,
        dataIndex: 'exit_at',
        key: 'exit_at',
        render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
        sorter: (a: Visit, b: Visit) => (dayjs(a.exit_at || 0).valueOf() - dayjs(b.exit_at || 0).valueOf()),
        sortOrder: sortKey === 'exit_at' ? sortOrder : null,
      },
      { title: 'Araç/Plaka', key: 'vehicle', render: (_: any, r: Visit) => r.has_vehicle ? (r.vehicle_plate ?? '') : 'YAYA' },
    ]
    if (!isViewer) {
      base.push({
        title: 'Aksiyon', key: 'action', render: (_: any, r: Visit) => (
          r.exit_at ? null : (
            <Button type="link" onClick={() => exitVisit(r.id)}>Çıkış Ver</Button>
          )
        )
      })
    }
    return base
  }, [isViewer, sortKey, sortOrder])

  return (
    <div style={{ padding: 16 }}>
      {maintenance && <div style={{ padding: 16, marginBottom: 12, background: '#fff1f0', border: '1px solid #ffa39e' }}>Sistem bakım modunda, değişiklik yapılamaz. Liste sadece görüntülenebilir.</div>}
      <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Ziyaret Kayıtları</div>
      {/* Filter form */}
      <Form layout="inline" style={{ marginBottom: 12 }}>
        <Form.Item label="Tarih">
          <RangePicker allowEmpty={[true, true]} aria-label="Tarih aralığı" value={dateRange as any} onChange={(v) => setDateRange(v as any)} showTime={false} />
        </Form.Item>
        <Form.Item label="Firma">
          <Input aria-label="Firma ara" value={company} onChange={(e) => setCompany(e.target.value)} allowClear placeholder="Firma" />
        </Form.Item>
        <Form.Item label="Araç">
          <Select aria-label="Araç durumu" value={hasVehicle} onChange={setHasVehicle} style={{ width: 120 }} options={[
            { value: '', label: 'Tümü' },
            { value: 'true', label: 'Var' },
            { value: 'false', label: 'Yok' },
          ]} />
        </Form.Item>
        <Form.Item label="Plaka">
          <Input aria-label="Plaka ara" value={plate} onChange={(e) => setPlate(e.target.value)} allowClear placeholder="Plaka" />
        </Form.Item>
        <Form.Item label="Ziyaret Edilen">
          <Input aria-label="Ziyaret edilen kişi ara" value={visitedPerson} onChange={(e) => setVisitedPerson(e.target.value)} allowClear placeholder="Ad Soyad" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={load} loading={loading}>Filtrele</Button>
            <Button onClick={exportExcel} disabled={loading}>Excel</Button>
          </Space>
        </Form.Item>
      </Form>

      <div role="region" aria-label="Kayıtlar tablosu ve sayfalama">
      <Table
        rowKey="id"
        columns={columns as any}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize, current: page, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (t) => `${t} kayıt` }}
        onChange={(_pagination, _filters, sorter: any) => {
          setSortKey(sorter?.field || null)
          setSortOrder(sorter?.order || null)
          if (_pagination?.current) setPage(_pagination.current)
          if (_pagination?.pageSize) setPageSize(_pagination.pageSize)
          // Sayfa/sort değişikliklerinde yeniden yükle
          setTimeout(() => load(), 0)
        }}
      />
      </div>
    </div>
  )
}
