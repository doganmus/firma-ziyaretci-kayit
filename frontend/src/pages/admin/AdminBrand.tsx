import { useEffect, useState } from 'react'
import { api, Settings } from '../../api/client'
import { Card, Form, Input, Button, Row, Col, message, Typography } from 'antd'

export default function AdminBrand() {
  const [brand, setBrand] = useState<Settings>({ brandName: null, brandLogoUrl: null })
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const s = await api.get<Settings>('/admin/settings')
        setBrand(s.data)
        localStorage.setItem('brandSettings', JSON.stringify(s.data))
      } catch {}
    }
    load()
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={3} style={{ margin: 0 }}>Marka Ayarları</Typography.Title>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Form layout="vertical" onFinish={async (vals: any) => {
          setSaving(true)
          try {
            const finalBrandName = (vals.brandName || '').trim()
            let payload: Partial<Settings> = { brandName: null, brandLogoUrl: null }

            if (logoFile) {
              const formData = new FormData()
              formData.append('file', logoFile)
              const resUpload = await fetch('/api/admin/settings/logo', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
                body: formData,
              })
              if (!resUpload.ok) {
                const text = await resUpload.text().catch(() => '')
                throw new Error(text || 'Logo yüklenemedi (yalnızca PNG, max 2MB)')
              }
              const uploaded = await resUpload.json()
              payload = { brandName: null, brandLogoUrl: uploaded.url || null }
            } else if (finalBrandName) {
              payload = { brandName: finalBrandName, brandLogoUrl: null }
            }
            const res = await api.patch<Settings>('/admin/settings', payload)
            setBrand(res.data)
            localStorage.setItem('brandSettings', JSON.stringify(res.data))
            window.dispatchEvent(new CustomEvent('brandSettingsChanged'))
            message.success('Kaydedildi')
            setLogoFile(null)
          } catch (e: any) {
            message.error(e?.message || 'İşlem başarısız')
          } finally {
            setSaving(false)
          }
        }} initialValues={{ brandName: brand.brandName ?? '' }}>
          <Row gutter={8}>
            <Col xs={24} md={8}>
              <Form.Item label="Firma Adı" name="brandName">
                <Input allowClear placeholder="Firma" />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Logo (PNG)</label>
                <input type="file" accept="image/png" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary, #888)' }}>
                Önerilen boyut: 28px yükseklik, genişlik orantılı. Maks 2MB PNG.
              </div>
            </Col>
            <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'end' }}>
              <Button type="primary" htmlType="submit" loading={saving}>Kaydet</Button>
            </Col>
          </Row>
          {(!brand.brandName && brand.brandLogoUrl) ? (
            <div style={{ marginTop: 8 }}>
              <img src={brand.brandLogoUrl} alt="Logo" style={{ height: 40 }} />
            </div>
          ) : null}
        </Form>
      </Card>
    </div>
  )
}


