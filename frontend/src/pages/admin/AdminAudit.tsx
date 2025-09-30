import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Card, DatePicker, Input, Select, Button, Space, Table, message } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

type Audit = {
  id: string
  createdAt: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  userId: string | null
  userEmail: string | null
  userRole: string | null
  ip: string | null
  userAgent: string | null
}

export default function AdminAudit() {
  const [items, setItems] = useState<Audit[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [method, setMethod] = useState<string>('')
  const [path, setPath] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [sortKey, setSortKey] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend')

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, sortKey, sortOrder: sortOrder === 'ascend' ? 'asc' : 'desc' }
      if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
      if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
      if (method) params.method = method
      if (path) params.path = path
      if (userEmail) params.userEmail = userEmail
      const res = await api.get<{ data: Audit[]; total: number }>('/admin/audit', { params })
      setItems(res.data.data)
      setTotal(res.data.total)
    } catch {
      setItems([])
      setTotal(0)
      message.error('Audit kayıtları yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const columns = useMemo(() => [
    { title: 'Tarih', dataIndex: 'createdAt', key: 'createdAt', sorter: true, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: 'Metod', dataIndex: 'method', key: 'method' },
    { title: 'Yol', dataIndex: 'path', key: 'path' },
    { title: 'Durum', dataIndex: 'statusCode', key: 'statusCode', sorter: true },
    { title: 'Süre (ms)', dataIndex: 'durationMs', key: 'durationMs', sorter: true },
    { title: 'Kullanıcı', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'Rol', dataIndex: 'userRole', key: 'userRole' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
  ], [])

  return (
    <div style={{ width: '100%' }}>
      <Card title="Audit Log">
        <Space wrap style={{ marginBottom: 12 }}>
          <RangePicker value={dateRange as any} onChange={(v) => setDateRange(v as any)} showTime />
          <Select allowClear placeholder="Metod" value={method} onChange={setMethod} style={{ width: 140 }} options={['GET','POST','PUT','PATCH','DELETE'].map(m => ({ value: m, label: m }))} />
          <Input allowClear placeholder="Yol içerir" value={path} onChange={(e) => setPath(e.target.value)} />
          <Input allowClear placeholder="Kullanıcı e-posta" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
          <Button type="primary" onClick={load} loading={loading}>Uygula</Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns as any}
          dataSource={items}
          loading={loading}
          pagination={{ pageSize, current: page, total, showSizeChanger: true, pageSizeOptions: [10,20,50] }}
          onChange={(p, _f, s: any) => {
            if (p?.current) setPage(p.current)
            if (p?.pageSize) setPageSize(p.pageSize)
            if (s?.field) setSortKey(s.field)
            if (s?.order) setSortOrder(s.order)
            setTimeout(() => load(), 0)
          }}
        />
      </Card>
    </div>
  )
}


