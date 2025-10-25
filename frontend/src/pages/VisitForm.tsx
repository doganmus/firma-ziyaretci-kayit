import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Switch, Button, Card, Typography, Alert, Row, Col, Table, DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

// Normalized TR plate formats (no spaces):
// 99X9999 or 99X99999 | 99XX999 or 99XX9999 | 99XXX99 or 99XXX999
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

// Form values used by AntD Form
type FormValues = {
  visitor_full_name: string
  visited_person_full_name: string
  company_name: string
  has_vehicle: boolean
  vehicle_plate?: string
  entry_at: Dayjs
  exit_at?: Dayjs
}

// Type representing a visit row from the API
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

export default function VisitForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeVisitors, setActiveVisitors] = useState<Visit[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()
  const [maintenance, setMaintenance] = useState(false)
  // Determine role to hide actions for VIEWER and handle maintenance gating
  const role = (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? (JSON.parse(u).role as string) : null
    } catch {
      return null
    }
  })()
  const isViewer = role === 'VIEWER'
  const isOperator = role === 'OPERATOR'
  useEffect(() => {
    ;(async () => {
      try {
        const s = await api.get('/settings/public')
        setMaintenance(!!s.data.maintenanceMode)
      } catch {}
    })()
  }, [])

  // Load current active (not exited) visits to show in the table below
  const loadActiveVehicles = async () => {
    const res = await api.get<{ data: Visit[]; total: number }>('/visits')
    const rows = Array.isArray((res.data as any)?.data) ? (res.data as any).data as Visit[] : ([] as Visit[])
    setActiveVisitors(rows.filter(v => !v.exit_at))
  }

  useEffect(() => {
    loadActiveVehicles()
  }, [])

  // Gate non-admin users during maintenance after hooks are registered
  if (maintenance && role !== 'ADMIN') {
    return <div style={{ padding: 16 }}>Sistem bakım modunda. Lütfen daha sonra tekrar deneyin.</div>
  }

  // Submit handler: create or update visit record via API
  const onFinish = async (values: FormValues) => {
    if (maintenance) {
      setMessage({ type: 'error', text: 'Bakım modunda işlem yapılamaz' })
      return
    }
    setMessage(null)
    try {
      setLoading(true)
      const normalizedPlate = (values.vehicle_plate ?? '').replace(/\s+/g, '').toUpperCase()
      const payload = {
        entry_at: values.entry_at ? dayjs(values.entry_at).toISOString() : undefined,
        exit_at: values.exit_at ? dayjs(values.exit_at).toISOString() : undefined,
        visitor_full_name: values.visitor_full_name.toLocaleUpperCase('tr-TR'),
        visited_person_full_name: values.visited_person_full_name.toLocaleUpperCase('tr-TR'),
        company_name: values.company_name.toLocaleUpperCase('tr-TR'),
        has_vehicle: values.has_vehicle,
        vehicle_plate: values.has_vehicle ? normalizedPlate : undefined,
      }
      if (editingId && isOperator) {
        await api.patch(`/visits/${editingId}`, payload)
        setMessage({ type: 'success', text: 'Kayıt güncellendi' })
      } else {
        await api.post('/visits', payload)
        setMessage({ type: 'success', text: 'Kayıt oluşturuldu' })
      }
      form.resetFields()
      setEditingId(null)
      await loadActiveVehicles()
    } catch {
      setMessage({ type: 'error', text: 'Hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  // Columns for the active visitors table
  const activeColumns: any[] = [
    { title: 'Plaka', dataIndex: 'vehicle_plate' },
    { title: 'Ziyaret eden', dataIndex: 'visitor_full_name' },
    { title: 'Ziyaret Edilen', dataIndex: 'visited_person_full_name' },
    { title: 'Firma', dataIndex: 'company_name' },
    { title: 'Giriş', dataIndex: 'entry_at', render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm') },
  ]
  // No exit actions anymore

  return (
    <div style={{ maxWidth: 960, margin: '24px auto' }}>
      <Card title="Ziyaretçi Kayıt">
        {/* Result message after submit */}
        {message && <Alert role="status" aria-live="polite" type={message.type} message={message.text} style={{ marginBottom: 16 }} />}        
        <Form<FormValues>
          form={form}
          layout="horizontal"
          labelCol={{ flex: '200px' }}
          labelAlign="left"
          onFinish={onFinish}
          initialValues={{ has_vehicle: false }}
        >
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
              <Form.Item
                label="Ziyaret eden Adı Soyadı"
                name="visitor_full_name"
                dependencies={['visited_person_full_name']}
                rules={[
                  { required: true, message: 'Ziyaret eden Adı Soyadı gerekli' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const other = getFieldValue('visited_person_full_name')
                      const a = (value ?? '').toString().trim()
                      const b = (other ?? '').toString().trim()
                      return !a || !b || a !== b
                        ? Promise.resolve()
                        : Promise.reject(new Error('Ziyaretçi ve Ziyaret edilen aynı olamaz'))
                    },
                  }),
                ]}
                getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}
              > 
                <Input placeholder="Ziyaretçi adı soyadı" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Ziyaret edilen Adı Soyadı"
                name="visited_person_full_name"
                dependencies={['visitor_full_name']}
                rules={[
                  { required: true, message: 'Ziyaret edilen kişi gerekli' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const other = getFieldValue('visitor_full_name')
                      const a = (value ?? '').toString().trim()
                      const b = (other ?? '').toString().trim()
                      return !a || !b || a !== b
                        ? Promise.resolve()
                        : Promise.reject(new Error('Ziyaretçi ve Ziyaret edilen aynı olamaz'))
                    },
                  }),
                ]}
                getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}
              > 
                <Input placeholder="Ziyaret edilen kişi" />
              </Form.Item>
            </Col>
          </Row>

          {/* Date fields under the name fields */}
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Giriş Tarih/Saat"
                name="entry_at"
                rules={[{ required: true, message: 'Giriş tarih/saat gerekli' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" placeholder="25.10.2025 15:00" inputReadOnly={false} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Çıkış Tarih/Saat (opsiyonel)"
                name="exit_at"
              >
                <DatePicker showTime style={{ width: '100%' }} format="DD.MM.YYYY HH:mm" placeholder="25.10.2025 15:00" inputReadOnly={false} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item label="Firma" name="company_name" rules={[{ required: true, message: 'Firma gerekli' }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}> 
                <Input placeholder="Firma adı" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Araç var mı?" name="has_vehicle" valuePropName="checked">
                <Switch onChange={(checked) => { if (!checked) { form.setFieldsValue({ vehicle_plate: undefined }); form.resetFields(['vehicle_plate']); } }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const hasVehicle = !!getFieldValue('has_vehicle')
                  return (
                    <Form.Item
                      label="Plaka"
                      name="vehicle_plate"
                      validateFirst
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!hasVehicle) return Promise.resolve()
                            const v = (value ?? '').toString().replace(/\s+/g, '').toUpperCase()
                            if (!v) return Promise.reject(new Error('Plaka gerekli'))
                            return TR_PLATE_REGEX.test(v)
                              ? Promise.resolve()
                              : Promise.reject(new Error('Geçersiz plaka. Örnekler: 34 A 1234, 34 A 12345, 34 AB 123, 34 AB 1234, 34 ABC 12, 34 ABC 123'))
                          },
                        },
                      ]}
                      getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}
                    >
                      <Input placeholder={hasVehicle ? 'Örn: 34 ABC 1234' : ''} disabled={!hasVehicle} />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading}>Kaydet</Button>
          </div>
        </Form>
      </Card>

      {/* List of visitors that are still inside (no exit yet) */}
      <Card style={{ marginTop: 16 }} title="İçerideki Ziyaretçiler (Çıkış Yapılmamış)">
        <Table
          rowKey="id"
          dataSource={activeVisitors}
          columns={activeColumns as any}
          pagination={{ pageSize: 5 }}
          onRow={(record) => ({
            onClick: () => {
              if (!isOperator) return
              setEditingId(record.id)
              form.setFieldsValue({
                visitor_full_name: record.visitor_full_name,
                visited_person_full_name: record.visited_person_full_name,
                company_name: record.company_name,
                has_vehicle: record.has_vehicle,
                vehicle_plate: record.vehicle_plate ?? undefined,
                entry_at: record.entry_at ? dayjs(record.entry_at) : undefined,
                exit_at: record.exit_at ? dayjs(record.exit_at) : undefined,
              } as any)
            }
          })}
        />
      </Card>
    </div>
  )
}
