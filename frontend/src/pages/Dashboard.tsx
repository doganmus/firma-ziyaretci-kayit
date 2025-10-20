import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Card, DatePicker, Row, Col, Statistic, Skeleton } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

type Overview = {
  kpis: { visitsTotal: number; visitsActive: number; vehiclesTotal: number; vehiclesActive: number }
  timeSeries: { visitsDaily: { day: string; count: number }[]; vehiclesDaily: { day: string; count: number }[] }
  vehicleTypeBreakdown: { type: string; count: number }[]
  topCompanies: { company: string; count: number }[]
}

const { RangePicker } = DatePicker
const COLORS = ['#1677ff', '#36cfc9', '#9254de', '#f759ab', '#faad14', '#73d13d']

export default function Dashboard() {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(() => [dayjs().add(-6, 'day'), dayjs()])
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (range?.[0]) params.dateFrom = range[0].toDate().toISOString()
      if (range?.[1]) params.dateTo = range[1].toDate().toISOString()
      const res = await api.get<Overview>('/reports/dashboard/overview', { params })
      // Normalize date strings for charts
      const d = res.data
      d.timeSeries.visitsDaily = d.timeSeries.visitsDaily.map(r => ({ ...r, day: dayjs(r.day).format('YYYY-MM-DD') }))
      d.timeSeries.vehiclesDaily = d.timeSeries.vehiclesDaily.map(r => ({ ...r, day: dayjs(r.day).format('YYYY-MM-DD') }))
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.[0]?.valueOf(), range?.[1]?.valueOf()])

  return (
    <div style={{ padding: 16 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col><div style={{ fontSize: 18, fontWeight: 600 }}>Dashboard</div></Col>
        <Col>
          <RangePicker allowEmpty={[true, true]} value={range as any} onChange={(v) => setRange(v as any)} />
        </Col>
      </Row>

      {loading || !data ? (
        <Skeleton active />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}><Card><Statistic title="Toplam Ziyaret" value={data.kpis.visitsTotal} /></Card></Col>
            <Col xs={24} sm={12} md={6}><Card><Statistic title="Aktif Ziyaret" value={data.kpis.visitsActive} /></Card></Col>
            <Col xs={24} sm={12} md={6}><Card><Statistic title="Araç Girişi" value={data.kpis.vehiclesTotal} /></Card></Col>
            <Col xs={24} sm={12} md={6}><Card><Statistic title="İçerideki Araç" value={data.kpis.vehiclesActive} /></Card></Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24} md={16}>
              <Card title="Günlük Giriş Trendleri (Ziyaret & Araç)">
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={mergeSeries(data.timeSeries.visitsDaily, data.timeSeries.vehiclesDaily)}>
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="visits" name="Ziyaret" stroke="#1677ff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="vehicles" name="Araç" stroke="#36cfc9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card title="Araç Türü Dağılımı">
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie dataKey="count" data={data.vehicleTypeBreakdown} nameKey="type" outerRadius={90}>
                        {data.vehicleTypeBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24}>
              <Card title="En Çok Ziyaret Alan İlk 5 Firma">
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.topCompanies}>
                      <XAxis dataKey="company" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Ziyaret" fill="#9254de" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}

// merges two daily series by day string
function mergeSeries(visits: { day: string; count: number }[], vehicles: { day: string; count: number }[]) {
  const map = new Map<string, { day: string; visits: number; vehicles: number }>()
  for (const r of visits) map.set(r.day, { day: r.day, visits: r.count, vehicles: 0 })
  for (const r of vehicles) {
    const prev = map.get(r.day)
    if (prev) prev.vehicles = r.count
    else map.set(r.day, { day: r.day, visits: 0, vehicles: r.count })
  }
  return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day))
}


