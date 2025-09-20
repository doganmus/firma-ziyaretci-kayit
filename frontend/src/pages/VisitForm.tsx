import React, { useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Switch, Button, Card, Typography, Alert, Row, Col } from 'antd'

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
          layout="horizontal"
          labelCol={{ flex: '200px' }}
          labelAlign="left"
          onFinish={onFinish}
          initialValues={{ has_vehicle: false }}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item label="Adı Soyadı" name="visitor_full_name" rules={[{ required: true, message: 'Adı Soyadı gerekli' }]}> 
                <Input placeholder="Ziyaretçi adı soyadı" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Ziyaret edilen Adı Soyadı" name="visited_person_full_name" rules={[{ required: true, message: 'Ziyaret edilen kişi gerekli' }]}> 
                <Input placeholder="Ziyaret edilen kişi" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item label="Firma" name="company_name" rules={[{ required: true, message: 'Firma gerekli' }]}> 
                <Input placeholder="Firma adı" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Araç var mı?" name="has_vehicle" valuePropName="checked">
                <Switch />
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
                              : Promise.reject(new Error('Plaka formatı geçersiz (örn. 34ABC1234)'))
                          },
                        },
                      ]}
                    >
                      <Input placeholder={hasVehicle ? 'Örn: 34ABC1234' : 'PASİF'} disabled={!hasVehicle} />
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
    </div>
  )
}
