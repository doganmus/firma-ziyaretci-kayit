import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Button, Card, Divider, Form, Input, InputNumber, message, Space, Switch, Typography, Upload } from 'antd'
import { UploadOutlined, CopyOutlined } from '@ant-design/icons'

export default function AdminOps() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ uptimeSec: number; node: string; env: string; version: string } | null>(null)
  const [maintenance, setMaintenance] = useState(false)

  const load = async () => {
    try {
      const [st, settings] = await Promise.all([
        api.get('/admin/ops/status'),
        api.get('/admin/settings'),
      ])
      setStatus(st.data)
      setMaintenance(!!settings.data.maintenanceMode)
    } catch (e: any) {
      message.error(e?.message || 'Durum alınamadı')
    }
  }

  useEffect(() => { load() }, [])

  const toggleMaintenance = async (enable: boolean) => {
    setLoading(true)
    try {
      if (enable) await api.post('/admin/ops/maintenance/enable')
      else await api.post('/admin/ops/maintenance/disable')
      setMaintenance(enable)
      message.success(`Bakım modu ${enable ? 'açıldı' : 'kapandı'}`)
    } catch (e: any) {
      message.error(e?.message || 'İşlem başarısız')
    } finally {
      setLoading(false)
    }
  }

  const onCleanup = async (vals: { olderThanDays: number }) => {
    setLoading(true)
    try {
      const res = await api.post('/admin/ops/audit/cleanup', vals)
      message.success(`Silinen kayıt: ${res.data.deleted}`)
    } catch (e: any) {
      message.error(e?.message || 'Temizlik başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="Sistem Durumu">
        <pre style={{ margin: 0 }}>{status ? JSON.stringify(status, null, 2) : 'Yükleniyor...'}</pre>
      </Card>
      <Card title="Bakım Modu">
        <Space>
          <span>Durum:</span>
          <Switch checked={maintenance} loading={loading} onChange={toggleMaintenance} checkedChildren="Açık" unCheckedChildren="Kapalı" />
        </Space>
        <Divider />
        <Typography.Paragraph type="secondary">
          Bakım modu açıkken ADMIN dışındaki kullanıcılar yalnızca kısıtlı görünüm görür ve değişiklik yapamaz.
        </Typography.Paragraph>
      </Card>
      <Card title="Audit Temizliği">
        <Form layout="inline" onFinish={onCleanup} initialValues={{ olderThanDays: 30 }}>
          <Form.Item name="olderThanDays" label="Günden eski" rules={[{ required: true }]}>
            <InputNumber min={1} max={365} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Temizle</Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="Sertifikalar (Bilgi)">
        <Typography.Paragraph>
          Sertifika dosyaları `certs/server.crt` ve `certs/server.key` olarak projede tutulur ve Nginx container'ına mount edilir.
        </Typography.Paragraph>
        <Divider />
        <Typography.Title level={5}>PEM Yükleme</Typography.Title>
        <Form layout="vertical" onFinish={async (vals: any) => {
          const form = new FormData()
          const crt = vals.crt?.[0]?.originFileObj
          const key = vals.key?.[0]?.originFileObj
          const chain = vals.chain?.[0]?.originFileObj
          if (crt) form.append('crt', crt as File)
          if (key) form.append('key', key as File)
          if (chain) form.append('chain', chain as File)
          try {
            await api.post('/admin/ops/cert/pem', form, { headers: { 'Content-Type': 'multipart/form-data' } })
            message.success('PEM sertifikalar yüklendi. Aşağıdaki komutlarla Nginx’i yeniden yükleyin.')
          } catch (e: any) {
            message.error(e?.message || 'Yükleme başarısız')
          }
        }}>
          <Form.Item name="crt" label="server.crt" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".crt,.pem,.cer,.pem">
              <Button icon={<UploadOutlined />}>CRT seç</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="key" label="server.key" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".key,.pem">
              <Button icon={<UploadOutlined />}>KEY seç</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="chain" label="Chain (opsiyonel)" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".crt,.pem,.cer">
              <Button icon={<UploadOutlined />}>CHAIN seç</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit">Yükle (PEM)</Button>
        </Form>

        <Divider />
        <Typography.Title level={5}>PFX/P12 Yükleme</Typography.Title>
        <Form layout="vertical" onFinish={async (vals: any) => {
          const form = new FormData()
          const pfx = vals.pfx?.[0]?.originFileObj
          if (pfx) form.append('pfx', pfx as File)
          form.append('password', vals.password || '')
          try {
            await api.post('/admin/ops/cert/pfx', form, { headers: { 'Content-Type': 'multipart/form-data' } })
            message.success('PFX içeriği yüklendi. Aşağıdaki komutlarla Nginx’i yeniden yükleyin.')
          } catch (e: any) {
            message.error(e?.message || 'Yükleme başarısız')
          }
        }}>
          <Form.Item name="pfx" label="Sertifika (PFX/P12)" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true }]}>
            <Upload beforeUpload={() => false} maxCount={1} accept=".pfx,.p12,application/x-pkcs12">
              <Button icon={<UploadOutlined />}>PFX seç</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="password" label="Parola" rules={[{ required: true }]}>
            <Input.Password placeholder="PFX parolası" />
          </Form.Item>
          <Button type="primary" htmlType="submit">Yükle (PFX)</Button>
        </Form>

        <Divider />
        <Typography.Title level={5}>Nginx Reload</Typography.Title>
        <Typography.Paragraph>
          Sertifika yüklendikten sonra yeniden yükleme yapmalısınız. Windows için PowerShell komutları:
        </Typography.Paragraph>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{`./scripts/reload-nginx.ps1`}</pre>
        <Space>
          <Button icon={<CopyOutlined />} onClick={() => navigator.clipboard.writeText('./scripts/reload-nginx.ps1')}>Komutu kopyala</Button>
        </Space>
      </Card>
    </Space>
  )
}


