import React, { useEffect, useState, useRef } from 'react'
import { api } from '../api/client'
import { Form, Input, Button, Card, Typography, Table, Row, Col, Select, DatePicker, Space, message, AutoComplete } from 'antd'
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
  load_status?: 'DOLU' | 'BOS' | null
  note?: string | null
}

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

export default function VehicleForm() {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<VehicleEvent[]>([])
  const [preview, setPreview] = useState<VehicleEvent | null>(null)
  const [editing, setEditing] = useState<{ id: string; action: 'ENTRY' | 'EXIT' } | null>(null)
  const [form] = Form.useForm<FormValues>()
  const [plateOptions, setPlateOptions] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const plateSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    loadDistricts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (preview) {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
      previewTimeoutRef.current = setTimeout(() => {
        setPreview(null)
      }, 60000) // 1 minute
    }
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [preview])

  useEffect(() => {
    return () => {
      if (plateSearchTimeoutRef.current) {
        clearTimeout(plateSearchTimeoutRef.current)
      }
    }
  }, [])

  const loadDistricts = async () => {
    try {
      const res = await api.get<{ data: string[] }>('/vehicle-events/districts')
      setDistricts(res.data.data || [])
    } catch (e) {
      console.error('Failed to load districts', e)
    }
  }

  const searchPlates = (searchText: string) => {
    if (plateSearchTimeoutRef.current) {
      clearTimeout(plateSearchTimeoutRef.current)
    }
    if (!searchText || searchText.length < 2) {
      setPlateOptions([])
      return
    }
    plateSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ data: VehicleEvent[]; total: number }>('/vehicle-events', {
          params: { plate: searchText, pageSize: 20 }
        })
        const uniquePlates = Array.from(new Set((res.data.data || []).map(e => e.plate)))
        setPlateOptions(uniquePlates)
      } catch (e) {
        console.error('Failed to search plates', e)
        setPlateOptions([])
      }
    }, 300)
  }

  const onValuesChange = (_: any, all: FormValues) => {
    if (all?.at) {
      loadActive(all.at as any)
    }
  }

  const submit = async (action: 'ENTRY' | 'EXIT', loadStatus: 'DOLU' | 'BOS') => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const normalizedPlate = (values.plate ?? '').replace(/\s+/g, '').toUpperCase()
      const payload: any = {
        action,
        plate: normalizedPlate,
        district: values.district || undefined,
        vehicle_type: values.vehicle_type || undefined,
        load_status: loadStatus,
        note: values.note || undefined,
        at: values.at ? dayjs(values.at).toISOString() : dayjs().toISOString(),
      }
      
      // Show preview
      const previewData: VehicleEvent = {
        id: 'preview',
        plate: normalizedPlate,
        action,
        at: payload.at,
        district: values.district || null,
        vehicle_type: values.vehicle_type || null,
        load_status: loadStatus,
        note: values.note || null,
      }
      setPreview(previewData)
      if (editing && editing.action === action) {
        await api.patch(`/vehicle-events/${editing.id}`, payload)
        message.success(action === 'EXIT' ? 'Çıkış güncellendi' : 'Giriş güncellendi')
      } else {
        // UI guard: if switching to EXIT and time equals an existing ENTRY time for same day, block
        if (action === 'EXIT') {
          try {
            const d = dayjs(values.at || dayjs())
            const from = d.startOf('day').toDate().toISOString()
            const to = d.endOf('day').toDate().toISOString()
            const res = await api.get<{ data: VehicleEvent[]; total: number }>(`/vehicle-events`, {
              params: { plate: payload.plate, action: 'ENTRY', dateFrom: from, dateTo: to, pageSize: 100 },
            })
            const same = (res.data?.data || []).some(e => dayjs(e.at).valueOf() === d.valueOf())
            if (same) {
              message.error('Giriş saati ile Çıkış saati aynı olamaz!')
              setPreview(null)
              return
            }
          } catch {}
        }
        await api.post('/vehicle-events', payload)
        const statusText = loadStatus === 'DOLU' ? ' (DOLU)' : ' (BOŞ)'
        message.success(action === 'EXIT' ? `Çıkış${statusText} kaydedildi` : `Giriş${statusText} kaydedildi`)
      }
      form.resetFields()
      setEditing(null)
      await loadActive()
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message
      const text = Array.isArray(serverMsg) ? serverMsg[0] : (serverMsg || 'Hata oluştu')
      message.error(text.toString())
    } finally {
      setLoading(false)
    }
  }

  const columns: any[] = [
    { title: 'Plaka', dataIndex: 'plate' },
    { 
      title: 'İşlem', 
      dataIndex: 'action', 
      render: (v: string, record: VehicleEvent) => {
        const actionText = v === 'ENTRY' ? 'GİRİŞ' : 'ÇIKIŞ'
        if (record.load_status) {
          return `${actionText} (${record.load_status})`
        }
        return actionText
      }
    },
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
              >
                <AutoComplete
                  options={plateOptions.map(p => ({ value: p }))}
                  onSearch={searchPlates}
                  placeholder="Örn: 34 ABC 1234"
                  filterOption={false}
                  onChange={(value) => {
                    form.setFieldValue('plate', value ? value.toUpperCase() : '')
                  }}
                />
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
                <Select
                  showSearch
                  placeholder="İlçe seçiniz"
                  options={districts.map(d => ({ value: d, label: d }))}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
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
            <Space direction="vertical" size="small">
              <Space>
                <Button onClick={() => submit('ENTRY', 'DOLU')} loading={loading} type="primary">Giriş Dolu</Button>
                <Button onClick={() => submit('ENTRY', 'BOS')} loading={loading} type="primary">Giriş Boş</Button>
              </Space>
              <Space>
                <Button onClick={() => submit('EXIT', 'DOLU')} loading={loading} danger>Çıkış Dolu</Button>
                <Button onClick={() => submit('EXIT', 'BOS')} loading={loading} danger>Çıkış Boş</Button>
              </Space>
            </Space>
          </div>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }} title="Kayıt Önizleme">
        <Table
          rowKey="id"
          dataSource={preview ? [preview] : []}
          columns={columns as any}
          pagination={false}
        />
      </Card>
    </div>
  )
}


