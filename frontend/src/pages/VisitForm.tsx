import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Switch, Button, Card, Typography, Alert, Row, Col, Table, Space, Popconfirm } from 'antd'
import dayjs from 'dayjs'

// Normalized TR plate formats (no spaces):
// 99X9999 or 99X99999 | 99XX999 or 99XX9999 | 99XXX99 or 99XXX999
const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

type FormValues = {
  visitor_full_name: string
  visited_person_full_name: string
  company_name: string
  has_vehicle: boolean
  vehicle_plate?: string
}

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
  const [activeVehicles, setActiveVehicles] = useState<Visit[]>([])

  const [form] = Form.useForm<FormValues>()

  const loadActiveVehicles = async () => {
    const res = await api.get<Visit[]>('/visits')
    setActiveVehicles((res.data || []).filter(v => !v.exit_at))
  }

  useEffect(() => {
    loadActiveVehicles()
  }, [])

  const onFinish = async (values: FormValues) => {
    setMessage(null)
    try {
      setLoading(true)
      const now = new Date().toISOString()
      const normalizedPlate = (values.vehicle_plate ?? '').replace(/\s+/g, '').toUpperCase()
      await api.post('/visits', {
        entry_at: now,
        visitor_full_name: values.visitor_full_name.toLocaleUpperCase('tr-TR'),
        visited_person_full_name: values.visited_person_full_name.toLocaleUpperCase('tr-TR'),
        company_name: values.company_name.toLocaleUpperCase('tr-TR'),
        has_vehicle: values.has_vehicle,
        vehicle_plate: values.has_vehicle ? normalizedPlate : undefined,
      })
      setMessage({ type: 'success', text: 'Kayıt oluşturuldu' })
      form.resetFields()
      await loadActiveVehicles()
    } catch {
      setMessage({ type: 'error', text: 'Hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const exitVisit = async (id: string) => {
    await api.post(`/visits/${id}/exit`)
    await loadActiveVehicles()
  }

  // Determine role to hide actions for VIEWER
  const role = (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? (JSON.parse(u).role as string) : null
    } catch {
      return null
    }
  })()
  const isViewer = role === 'VIEWER'

  const activeColumns: any[] = [
    { title: 'Plaka', dataIndex: 'vehicle_plate' },
    { title: 'Ad Soyad', dataIndex: 'visitor_full_name' },
    { title: 'Ziyaret Edilen', dataIndex: 'visited_person_full_name' },
    { title: 'Firma', dataIndex: 'company_name' },
    { title: 'Giriş', dataIndex: 'entry_at', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ]
  if (!isViewer) {
    activeColumns.push({
      title: 'Aksiyon', key: 'action', render: (_: any, r: Visit) => (
        <Space>
          <Popconfirm title="Çıkış verilsin mi?" onConfirm={() => exitVisit(r.id)}>
            <Button type="link">Çıkış Yap</Button>
          </Popconfirm>
        </Space>
      )
    })
  }

  return (
    <div style={{ maxWidth: 960, margin: '24px auto' }}>
      <Card>
        {message && <Alert type={message.type} message={message.text} style={{ marginBottom: 16 }} />}        
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
              <Form.Item label="Adı Soyadı" name="visitor_full_name" rules={[{ required: true, message: 'Adı Soyadı gerekli' }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}> 
                <Input placeholder="Ziyaretçi adı soyadı" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Ziyaret edilen Adı Soyadı" name="visited_person_full_name" rules={[{ required: true, message: 'Ziyaret edilen kişi gerekli' }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}> 
                <Input placeholder="Ziyaret edilen kişi" />
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

      <Card style={{ marginTop: 16 }} title="İçerideki Araçlar (Çıkış Yapılmamış)">
        <Table
          rowKey="id"
          dataSource={activeVehicles}
          columns={activeColumns as any}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  )
}
