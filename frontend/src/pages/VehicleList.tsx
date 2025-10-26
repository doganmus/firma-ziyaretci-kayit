import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Table, Form, Input, DatePicker, Button, Space, Select } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

type VehicleEvent = {
  id: string
  plate: string
  action: 'ENTRY' | 'EXIT'
  at: string
  district?: string | null
  vehicle_type?: string | null
  note?: string | null
}

export default function VehicleList() {
  const [items, setItems] = useState<VehicleEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [plate, setPlate] = useState('')
  const [action, setAction] = useState<'ENTRY' | 'EXIT' | ''>('')
  const [district, setDistrict] = useState('')
  const [vehicleType, setVehicleType] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
      if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
      if (plate) params.plate = plate
      if (action) params.action = action
      if (district) params.district = district
      if (vehicleType) params.vehicleType = vehicleType
      if (sortKey) params.sortKey = sortKey
      if (sortOrder) params.sortOrder = sortOrder === 'ascend' ? 'asc' : 'desc'
      params.page = page
      params.pageSize = pageSize
      const res = await api.get<{ data: VehicleEvent[]; total: number }>('/vehicle-events', { params })
      setItems(res.data.data)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortKey, sortOrder])

  // no inline exit in event model

  const columns = useMemo(() => {
    const base: any[] = [
      { title: 'Plaka', dataIndex: 'plate', key: 'plate', sorter: (a: VehicleEvent, b: VehicleEvent) => a.plate.localeCompare(b.plate), sortOrder: sortKey === 'plate' ? sortOrder : null },
      { title: 'İşlem', dataIndex: 'action', key: 'action' },
      { title: 'Tarih', dataIndex: 'at', key: 'at', render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'), sorter: (a: VehicleEvent, b: VehicleEvent) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf(), sortOrder: sortKey === 'at' ? sortOrder : null },
      { title: 'İlçe', dataIndex: 'district', key: 'district' },
      { title: 'Araç Türü', dataIndex: 'vehicle_type', key: 'vehicle_type' },
      { title: 'Not', dataIndex: 'note', key: 'note' },
    ]
    return base
  }, [sortKey, sortOrder])

  const exportExcel = () => {
    const headers = ['Plaka','İşlem','Tarih','İlçe','Araç Türü','Not']
    const rows = items.map(v => [
      v.plate,
      v.action,
      dayjs(v.at).format('DD.MM.YYYY HH:mm'),
      v.district || '',
      v.vehicle_type || '',
      v.note || '',
    ])
    const worksheet = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Araclar"><Table>${[headers, ...rows]
      .map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${(c ?? '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`).join('')}</Row>`)
      .join('')}</Table></Worksheet></Workbook>`
    const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `araclar_${Date.now()}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Araç Kayıtları</div>
      <Form layout="inline" style={{ marginBottom: 12 }}>
        <Form.Item label="Tarih">
          <RangePicker allowEmpty={[true, true]} value={dateRange as any} onChange={(v) => setDateRange(v as any)} showTime={false} />
        </Form.Item>
        <Form.Item label="Plaka">
          <Input value={plate} onChange={(e) => setPlate(e.target.value)} allowClear placeholder="Plaka" />
        </Form.Item>
        <Form.Item label="İşlem">
          <Select value={action} onChange={(v) => setAction(v)} allowClear placeholder="Seçiniz" style={{ width: 160 }} options={[
            { value: 'ENTRY', label: 'GİRİŞ' },
            { value: 'EXIT', label: 'ÇIKIŞ' },
          ]} />
        </Form.Item>
        <Form.Item label="İlçe">
          <Input aria-label="İlçe" value={district} onChange={(e) => setDistrict(e.target.value)} allowClear placeholder="İlçe" />
        </Form.Item>
        <Form.Item label="Araç Türü">
          <Select value={vehicleType} onChange={setVehicleType} allowClear placeholder="Seçiniz" style={{ width: 160 }} options={[
            { value: 'SERVIS', label: 'SERVİS' },
            { value: 'BINEK', label: 'BİNEK' },
            { value: 'TICARI', label: 'TİCARİ' },
            { value: 'DIGER', label: 'DİĞER' },
          ]} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={load} loading={loading}>Filtrele</Button>
            <Button onClick={exportExcel} disabled={loading}>Excel</Button>
          </Space>
        </Form.Item>
      </Form>

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
        }}
      />
    </div>
  )
}


