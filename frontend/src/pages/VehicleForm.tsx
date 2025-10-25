import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Button, Card, Typography, Table, Row, Col, Select, Radio, DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { Title } = Typography

type FormValues = {
  plate: string
  district?: string
  vehicle_type?: string
  note?: string
  action?: 'entry' | 'exit'
  entry_at?: Dayjs
  exit_at?: Dayjs
}

type VehicleLog = {
  id: string
  plate: string
  entry_at: string
  exit_at: string | null
  district?: string | null
  vehicle_type?: string | null
  note?: string | null
}

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

export default function VehicleForm() {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<VehicleLog[]>([])
  const [form] = Form.useForm<FormValues>()

  const loadActive = async () => {
    const res = await api.get<{ data: VehicleLog[]; total: number }>('/vehicle-logs', { params: { active: true, pageSize: 100 } })
    setActive(Array.isArray((res.data as any)?.data) ? (res.data as any).data : [])
  }

  useEffect(() => {
    loadActive()
  }, [])

  const onFinish = async (values: FormValues) => {
    setLoading(true)
    try {
      const payload: any = {
        plate: (values.plate ?? '').replace(/\s+/g, '').toUpperCase(),
        district: values.district || undefined,
        vehicle_type: values.vehicle_type || undefined,
        note: values.note || undefined,
        entry_at: values.entry_at ? dayjs(values.entry_at).toISOString() : undefined,
        exit_at: values.exit_at ? dayjs(values.exit_at).toISOString() : undefined,
      }
      if (values.action === 'exit') {
        // Bulması için aktif listeden ilk eşleşeni çıkış veriyoruz (basit UX)
        const match = active.find(a => a.plate.replace(/\s+/g,'').toUpperCase() === payload.plate && !a.exit_at)
        if (match) {
          await api.post(`/vehicle-logs/${match.id}/exit`)
        } else {
          // eşleşme yoksa giriş kaydı oluştur (fallback)
          await api.post('/vehicle-logs', payload)
        }
      } else {
        await api.post('/vehicle-logs', payload)
      }
      form.resetFields()
      await loadActive()
    } finally {
      setLoading(false)
    }
  }

  const exitVehicle = async (id: string) => {
    await api.post(`/vehicle-logs/${id}/exit`)
    await loadActive()
  }

  const columns: any[] = [
    { title: 'Plaka', dataIndex: 'plate' },
    { title: 'Giriş', dataIndex: 'entry_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: 'Aksiyon', key: 'action', render: (_: any, r: VehicleLog) => (
      <Button type="link" onClick={() => exitVehicle(r.id)}>Çıkış Ver</Button>
    ) },
  ]

  return (
    <div style={{ padding: 16 }}>
      <Card>
        <Title level={4} style={{ marginTop: 0 }}>Araç Girişi</Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Plaka"
            name="plate"
            rules={[
              { required: true, message: 'Plaka gerekli' },
              {
                validator: (_, value) => {
                  const v = (value ?? '').toString().replace(/\s+/g, '').toUpperCase()
                  return TR_PLATE_REGEX.test(v) ? Promise.resolve() : Promise.reject(new Error('Geçersiz plaka'))
                }
              }
            ]}
            getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}
          >
            <Input placeholder="Örn: 34 ABC 1234" />
          </Form.Item>

          <Row gutter={[16,8]}>
          <Col xs={24} md={12}>
            <Form.Item label="Giriş Tarih/Saat" name="entry_at" rules={[{ required: true, message: 'Giriş tarih/saat gerekli' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Çıkış Tarih/Saat (opsiyonel)" name="exit_at">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16,8]}>
            <Col xs={24} md={12}>
              <Form.Item label="İlçe" name="district" rules={[{ required: true, message: 'İlçe gerekli' }]}>
                <Input placeholder="İlçe" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Araç Türü" name="vehicle_type" rules={[{ required: true, message: 'Araç türü gerekli' }]}>
                <Select allowClear placeholder="Seçiniz" options={[
                  { value: 'SERVIS', label: 'SERVİS' },
                  { value: 'BINEK', label: 'BİNEK' },
                  { value: 'TICARI', label: 'TİCARİ' },
                  { value: 'DIGER', label: 'DİĞER' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Not" name="note">
            <Input.TextArea rows={3} placeholder="Notlar" />
          </Form.Item>

          <Form.Item label="İşlem" name="action" initialValue="entry">
            <Radio.Group>
              <Radio.Button value="entry">Giriş</Radio.Button>
              <Radio.Button value="exit">Çıkış</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit" loading={loading}>Kaydet</Button>
          </div>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }} title="İçerideki Araçlar (Çıkış Yapılmamış)">
        <Table rowKey="id" dataSource={active} columns={columns as any} pagination={false} />
      </Card>
    </div>
  )
}


