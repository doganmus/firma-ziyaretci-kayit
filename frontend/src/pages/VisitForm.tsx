import { useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Checkbox, Button, Card, Typography, Alert, Space, Row, Col } from 'antd'

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)[A-Z]{1,3}[0-9]{2,4}$/

type FormValues = {
  visitor_full_name: string
  visited_person_full_name: string
  company_name: string
  has_vehicle: boolean
  vehicle_plate?: string
}

export default function VisitForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form] = Form.useForm<FormValues>()

  const onFinish = async (values: FormValues) => {
    setMessage(null)
    try {
      setLoading(true)
      const now = new Date().toISOString()
      const normalizedPlate = (values.vehicle_plate ?? '').replace(/\s+/g, '').toUpperCase()
      await api.post('/visits', {
        entry_at: now,
        visitor_full_name: values.visitor_full_name,
        visited_person_full_name: values.visited_person_full_name,
        company_name: values.company_name,
        has_vehicle: values.has_vehicle,
        vehicle_plate: values.has_vehicle ? normalizedPlate : undefined,
      })
      setMessage({ type: 'success', text: 'Kayıt oluşturuldu' })
      form.resetFields()
    } catch {
      setMessage({ type: 'error', text: 'Hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '24px auto' }}>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 16 }}>Kayıt</Typography.Title>
        {message && <Alert type={message.type} message={message.text} style={{ marginBottom: 16 }} />}
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ has_vehicle: false }}
        >
          <Row gutter={[16, 8]} align="middle">
            <Col xs={24} md={12}>
              <Space.Compact block>
                <Button disabled style={{ width: 140, textAlign: 'left' }}>Adı Soyadı</Button>
                <Form.Item name="visitor_full_name" rules={[{ required: true, message: 'Adı Soyadı gerekli' }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder="Ziyaretçi adı soyadı" />
                </Form.Item>
              </Space.Compact>
            </Col>
            <Col xs={24} md={12}>
              <Space.Compact block>
                <Button disabled style={{ width: 200, textAlign: 'left' }}>Ziyaret edilen Adı Soyadı</Button>
                <Form.Item name="visited_person_full_name" rules={[{ required: true, message: 'Ziyaret edilen kişi gerekli' }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder="Ziyaret edilen kişi" />
                </Form.Item>
              </Space.Compact>
            </Col>
          </Row>

          <Row gutter={[16, 8]} align="middle" style={{ marginTop: 8 }}>
            <Col xs={24} md={8}>
              <Space.Compact block>
                <Button disabled style={{ width: 80, textAlign: 'left' }}>Firma</Button>
                <Form.Item name="company_name" rules={[{ required: true, message: 'Firma gerekli' }]} style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder="Firma adı" />
                </Form.Item>
              </Space.Compact>
            </Col>
            <Col xs={24} md={8}>
              <Space align="center">
                <Form.Item name="has_vehicle" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Checkbox>Araç var mı?</Checkbox>
                </Form.Item>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space.Compact block>
                <Button disabled style={{ width: 60, textAlign: 'left' }}>Plaka</Button>
                <Form.Item
                  name="vehicle_plate"
                  style={{ flex: 1, marginBottom: 0 }}
                  shouldUpdate={false}
                  rules={[{
                    validator: (_, value) => {
                      const hasVehicle = form.getFieldValue('has_vehicle') as boolean
                      const v = (value ?? '').toString().replace(/\s+/g, '').toUpperCase()
                      if (!hasVehicle) return Promise.resolve()
                      if (!v) return Promise.reject(new Error('Plaka gerekli'))
                      return TR_PLATE_REGEX.test(v)
                        ? Promise.resolve()
                        : Promise.reject(new Error('Plaka formatı geçersiz (örn. 34ABC1234)'))
                    }
                  }]}
                >
                  <Input placeholder={form.getFieldValue('has_vehicle') ? 'Örn: 34ABC1234' : 'PASİF'} disabled={!form.getFieldValue('has_vehicle')} onChange={(e) => { e.target.value = e.target.value.toUpperCase() }} />
                </Form.Item>
              </Space.Compact>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>Kaydet</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
