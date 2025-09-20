import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, DatePicker, Button, Space, Statistic, Table } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

type Summary = { total: number; withVehicle: number; withoutVehicle: number; active: number; exited: number }

type ByCompany = { company: string; count: number }

export default function Reports() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byCompany, setByCompany] = useState<ByCompany[]>([])
  const [loading, setLoading] = useState(false)

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

  const downloadExcel = async () => {
    const params: any = {}
    if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
    if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
    const res = await api.get('/reports/export/excel', { params, responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reports.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = async () => {
    const params: any = {}
    if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
    if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
    const res = await api.get('/reports/export/pdf', { params, responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reports.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <RangePicker value={dateRange as any} onChange={(v) => setDateRange(v as any)} />
          <Button type="primary" onClick={load} loading={loading}>Uygula</Button>
        </Space>
        <Space>
          <Button onClick={downloadExcel}>Excel</Button>
          <Button onClick={downloadPdf}>PDF</Button>
        </Space>
      </Space>

      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Space size={24} wrap>
            <Statistic title="Toplam" value={summary.total} />
            <Statistic title="Araçlı" value={summary.withVehicle} />
            <Statistic title="Araçsız" value={summary.withoutVehicle} />
            <Statistic title="Aktif" value={summary.active} />
            <Statistic title="Çıkışlı" value={summary.exited} />
          </Space>
        </Card>
      )}

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
