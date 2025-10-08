import React, { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Button, Card, Divider, Form, InputNumber, message, Space, Switch, Typography } from 'antd'

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
        <Typography.Paragraph>
          PowerShell komutu (self-signed):
        </Typography.Paragraph>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{`openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.crt -days 365 -subj "/CN=localhost"`}</pre>
        <Typography.Paragraph>
          Nginx reload:
        </Typography.Paragraph>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{`& "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe" compose exec frontend nginx -s reload`}</pre>
      </Card>
    </Space>
  )
}


