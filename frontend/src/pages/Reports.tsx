import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, DatePicker, Button, Space, Statistic, Table } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// Summary stats returned by the backend
type Summary = { total: number; withVehicle: number; withoutVehicle: number; active: number; exited: number }

// Company breakdown rows
type ByCompany = { company: string; count: number }

export default function Reports() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byCompany, setByCompany] = useState<ByCompany[]>([])
  const [loading, setLoading] = useState(false)

  // Loads report data for the selected date range
  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
      if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
      const s = await api.get<Summary>('/reports/summary', { params })
      const c = await api.get<ByCompany[]>('/reports/by-company', { params })
      setSummary(s.data)
      setByCompany(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Rapor</div>
      {/* Date filters and refresh button */}
      <Space align="center" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 12 }}>
        <RangePicker value={dateRange as any} onChange={(v) => setDateRange(v as any)} />
        <Button type="primary" onClick={load} loading={loading}>Uygula</Button>
      </Space>

      {/* Top summary cards */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Space size={24} wrap>
            <Statistic title="Toplam" value={summary.total} />
            <Statistic title="Araçlı" value={summary.withVehicle} />
            <Statistic title="Araçsız" value={summary.withoutVehicle} />
            <Statistic title="İçeride" value={summary.active} />
            <Statistic title="Çıkış Yapan" value={summary.exited} />
          </Space>
        </Card>
      )}

      {/* Company table */}
      <Card title="Firma Bazlı">
        <Table
          rowKey={(r) => r.company}
          dataSource={byCompany}
          columns={[
            { title: 'Firma', dataIndex: 'company' },
            { title: 'Adet', dataIndex: 'count' },
          ]}
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>
    </div>
  )
}
