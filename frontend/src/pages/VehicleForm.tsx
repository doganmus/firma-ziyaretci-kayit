import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Button, Card, Typography, Table, Row, Col, Select, DatePicker, Space, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { Title } = Typography

type FormValues = {
  plate: string
  district?: string
  vehicle_type?: string
  note?: string
  at?: Dayjs
}

type VehicleEvent = {
  id: string
  plate: string
  action: 'ENTRY' | 'EXIT'
  at: string
  district?: string | null
  vehicle_type?: string | null
  note?: string | null
}

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

export default function VehicleForm() {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<VehicleEvent[]>([])
  const [editing, setEditing] = useState<{ id: string; action: 'ENTRY' | 'EXIT' } | null>(null)
  const [form] = Form.useForm<FormValues>()

  const loadActive = async (forDate?: dayjs.Dayjs | null) => {
    const d = forDate || form.getFieldValue('at') || dayjs()
    const day = dayjs(d)
    const from = day.startOf('day').toDate().toISOString()
    const to = day.endOf('day').toDate().toISOString()
    const res = await api.get<{ data: VehicleEvent[]; total: number }>('/vehicle-events', { params: { active: true, pageSize: 100, dateFrom: from, dateTo: to } })
    setActive(Array.isArray((res.data as any)?.data) ? (res.data as any).data : [])
  }

  useEffect(() => {
    loadActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onValuesChange = (_: any, all: FormValues) => {
    if (all?.at) {
      loadActive(all.at as any)
    }
  }

  const submit = async (action: 'ENTRY' | 'EXIT') => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const payload: any = {
        action,
        plate: (values.plate ?? '').replace(/\s+/g, '').toUpperCase(),
        district: values.district || undefined,
        vehicle_type: values.vehicle_type || undefined,
        note: values.note || undefined,
        at: values.at ? dayjs(values.at).toISOString() : dayjs().toISOString(),
      }
      if (editing && editing.action === action) {
        await api.patch(`/vehicle-events/${editing.id}`, payload)
      } else {
        // UI guard: if switching to EXIT and time equals an existing ENTRY time for same day, block
        if (action === 'EXIT') {
          try {
            const day = dayjs(values.at || dayjs())
            const from = day.startOf('day').toDate().toISOString()
            const to = day.endOf('day').toDate().toISOString()
            const res = await api.get<{ data: VehicleEvent[]; total: number }>(`/vehicle-events`, {
              params: { plate: payload.plate, action: 'ENTRY', dateFrom: from, dateTo: to, pageSize: 100 },
            })
            const same = (res.data?.data || []).some(e => dayjs(e.at).valueOf() === day.valueOf())
            if (same) {
              message.error('Giriş saati ile Çıkış saati aynı olamaz!')
              return
            }
          } catch {}
        }
        await api.post('/vehicle-events', payload)
      }
      form.resetFields()
      setEditing(null)
      await loadActive()
    } finally {
      setLoading(false)
    }
  }

  const columns: any[] = [
    { title: 'Plaka', dataIndex: 'plate' },
    { title: 'İşlem', dataIndex: 'action', render: (v: string) => v === 'ENTRY' ? 'GİRİŞ' : 'ÇIKIŞ' },
    { title: 'Tarih', dataIndex: 'at', render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm') },
    { title: 'İlçe', dataIndex: 'district' },
    { title: 'Araç Türü', dataIndex: 'vehicle_type' },
    { title: 'Not', dataIndex: 'note' },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '24px auto' }}>
      <Card title="Araç Kayıt">
        <Form form={form} layout="vertical" onValuesChange={onValuesChange} initialValues={{ at: dayjs() }}>
          <Row gutter={[16,8]}>
            <Col xs={24} md={12}>
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
                <Input placeholder="Örn: 34 ABC 1234" maxLength={12} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tarih" name="at" rules={[{ required: true, message: 'Tarih gerekli' }]}>
                <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" placeholder="25.10.2025 15:00" inputReadOnly={false} />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => submit('ENTRY')} loading={loading} type="primary">Giriş</Button>
              <Button onClick={() => submit('EXIT')} loading={loading} danger>Çıkış</Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }} title="İçerideki Araçlar (Çıkış Yapılmamış)">
        <Table
          rowKey="id"
          dataSource={active}
          columns={columns as any}
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              setEditing({ id: record.id, action: record.action })
              form.setFieldsValue({
                plate: record.plate,
                at: record.at ? dayjs(record.at) : undefined,
                district: record.district ?? undefined,
                vehicle_type: record.vehicle_type ?? undefined,
                note: record.note ?? undefined,
              } as any)
            }
          })}
        />
      </Card>
    </div>
  )
}


