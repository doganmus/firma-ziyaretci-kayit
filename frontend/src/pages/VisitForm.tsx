import { useState } from 'react'
import { api } from '../api/client'
import { Form, Input, Checkbox, Button, Card, Typography, Alert, Space } from 'antd'

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
    } catch {
      setMessage({ type: 'error', text: 'Hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '24px auto' }}>
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 16 }}>Ziyaret Kaydı</Typography.Title>
        {message && <Alert type={message.type} message={message.text} style={{ marginBottom: 16 }} />}
        <Form<FormValues>
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ has_vehicle: false }}
        >
          <Form.Item label="Adı Soyadı" name="visitor_full_name" rules={[{ required: true, message: 'Adı Soyadı gerekli' }]}> 
            <Input placeholder="Ziyaretçi adı soyadı" />
          </Form.Item>
          <Form.Item label="Ziyaret Edilen Adı Soyadı" name="visited_person_full_name" rules={[{ required: true, message: 'Ziyaret edilen kişi gerekli' }]}> 
            <Input placeholder="Ziyaret edilen kişi" />
          </Form.Item>
          <Form.Item label="Firma" name="company_name" rules={[{ required: true, message: 'Firma gerekli' }]}> 
            <Input placeholder="Firma adı" />
          </Form.Item>

          <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 8 }}>
            <Form.Item name="has_vehicle" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Araç var mı?</Checkbox>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.has_vehicle !== curr.has_vehicle}>
              {({ getFieldValue }) => {
                const hasVehicle = getFieldValue('has_vehicle') as boolean
                return (
                  <Form.Item
                    label="Plaka"
                    name="vehicle_plate"
                    validateFirst
                    rules={[
                      {
                        validator: (_, value) => {
                          const v = (value ?? '').toString().replace(/\s+/g, '').toUpperCase()
                          if (!hasVehicle) return Promise.resolve()
                          if (!v) return Promise.reject(new Error('Plaka gerekli'))
                          return TR_PLATE_REGEX.test(v)
                            ? Promise.resolve()
                            : Promise.reject(new Error('Plaka formatı geçersiz (örn. 34ABC1234)'))
                        },
                      },
                    ]}
                  >
                    <Input placeholder={hasVehicle ? 'Örn: 34ABC1234' : 'PASİF'} disabled={!hasVehicle} onChange={(e) => { e.target.value = e.target.value.toUpperCase() }} />
                  </Form.Item>
                )
              }}
            </Form.Item>
          </Space>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Kaydet</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
