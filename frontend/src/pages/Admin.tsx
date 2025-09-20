import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Card, Typography, Form, Input, Select, Button, Table, Space, Popconfirm, message, Row, Col, Divider } from 'antd'
import { Settings } from '../api/client'

type User = { id: string; email: string; full_name: string; role: string }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [rowPasswords, setRowPasswords] = useState<Record<string, string>>({})
  const [searchEmail, setSearchEmail] = useState('')
  const [searchName, setSearchName] = useState('')
  const [brand, setBrand] = useState<Settings>({ brandName: null, brandLogoUrl: null })
  const [savingBrand, setSavingBrand] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [form] = Form.useForm()

  const applyFilters = (list: User[], email: string, name: string) => {
    const e = email.trim().toLowerCase()
    const n = name.trim().toLowerCase()
    return list.filter(u => (
      (!e || u.email.toLowerCase().includes(e)) &&
      (!n || (u.full_name || '').toLowerCase().includes(n))
    ))
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<User[]>('/admin/users')
      setUsers(res.data)
      setFiltered(applyFilters(res.data, searchEmail, searchName))
      try {
        const s = await api.get<Settings>('/admin/settings')
        setBrand(s.data)
        localStorage.setItem('brandSettings', JSON.stringify(s.data))
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setFiltered(applyFilters(users, searchEmail, searchName)) }, [users, searchEmail, searchName])

  const createUser = async (values: { email: string; full_name: string; password: string; role: string }) => {
    if (!EMAIL_RE.test(values.email)) { message.error('Geçersiz e-posta'); return }
    if ((values.password || '').length < 6) { message.error('Şifre en az 6 karakter'); return }
    setCreating(true)
    try {
      await api.post('/admin/users', values)
      form.resetFields()
      await load()
      message.success('Kullanıcı eklendi')
    } finally {
      setCreating(false)
    }
  }

  const updateUser = async (id: string, data: Partial<{ full_name: string; password: string; role: string }>) => {
    await api.patch(`/admin/users/${id}`, data)
    await load()
    message.success('Güncellendi')
  }

  const removeUser = async (id: string) => {
    await api.delete(`/admin/users/${id}`)
    await load()
    message.success('Silindi')
  }

  const setRowPassword = (id: string, val: string) => setRowPasswords(prev => ({ ...prev, [id]: val }))
  const saveRowPassword = async (id: string) => {
    const p = rowPasswords[id] || ''
    if (p.length < 6) { message.error('Şifre en az 6 karakter olmalı'); return }
    await updateUser(id, { password: p })
    setRowPasswords(prev => ({ ...prev, [id]: '' }))
  }

  const columns = useMemo(() => [
    { title: 'E-posta', dataIndex: 'email', key: 'email', sorter: (a: User, b: User) => a.email.localeCompare(b.email) },
    { title: 'Ad Soyad', dataIndex: 'full_name', key: 'full_name', sorter: (a: User, b: User) => (a.full_name || '').localeCompare(b.full_name || '') },
    {
      title: 'Rol', dataIndex: 'role', key: 'role', sorter: (a: User, b: User) => a.role.localeCompare(b.role), render: (v: string, r: User) => (
        <Select
          value={v}
          onChange={(val) => updateUser(r.id, { role: val })}
          options={[
            { value: 'ADMIN', label: 'ADMIN' },
            { value: 'OPERATOR', label: 'OPERATOR' },
            { value: 'VIEWER', label: 'VIEWER' },
          ]}
          style={{ width: 140 }}
        />
      )
    },
    {
      title: 'Şifre', key: 'password', render: (_: any, r: User) => (
        <Space.Compact style={{ width: 280 }}>
          <Input.Password placeholder="Yeni şifre" value={rowPasswords[r.id] || ''} onChange={(e) => setRowPassword(r.id, e.target.value)} />
          <Button type="primary" onClick={() => saveRowPassword(r.id)}>Kaydet</Button>
        </Space.Compact>
      )
    },
    {
      title: 'Aksiyon', key: 'action', render: (_: any, r: User) => (
        <Popconfirm title="Silinsin mi?" onConfirm={() => removeUser(r.id)}>
          <Button danger>Sil</Button>
        </Popconfirm>
      )
    },
  ], [rowPasswords])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Typography.Title level={3} style={{ margin: 0 }}>Admin - Kullanıcı Yönetimi</Typography.Title>
        </Card>

        <Card title="Marka Ayarları">
          <Form layout="vertical" onFinish={async (vals: any) => {
            setSavingBrand(true)
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
              setSavingBrand(false)
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
                <Button type="primary" htmlType="submit" loading={savingBrand}>Kaydet</Button>
              </Col>
            </Row>
            {(!brand.brandName && brand.brandLogoUrl) ? (
              <div style={{ marginTop: 8 }}>
                <img src={brand.brandLogoUrl} alt="Logo" style={{ height: 40 }} />
              </div>
            ) : null}
          </Form>
        </Card>

        <Card title="Kullanıcı Ekle">
          <Form form={form} layout="inline" onFinish={createUser} autoComplete="off" initialValues={{ role: 'OPERATOR' }}>
            <Form.Item name="email" rules={[{ required: true, message: 'E-posta gerekli' }, { type: 'email', message: 'Geçerli e-posta' }]}>
              <Input placeholder="E-posta" />
            </Form.Item>
            <Form.Item name="full_name" rules={[{ required: true, message: 'Ad Soyad gerekli' }]}>
              <Input placeholder="Ad Soyad" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Şifre gerekli' }, { min: 6, message: 'En az 6 karakter' }]}>
              <Input.Password placeholder="Şifre" />
            </Form.Item>
            <Form.Item name="role" rules={[{ required: true }]}>
              <Select style={{ width: 160 }} options={[
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'OPERATOR', label: 'OPERATOR' },
                { value: 'VIEWER', label: 'VIEWER' },
              ]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={creating}>Ekle</Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Kullanıcılar">
          <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col xs={24} md={8}>
              <Input allowClear placeholder="E-posta ara" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
            </Col>
            <Col xs={24} md={8}>
              <Input allowClear placeholder="Ad Soyad ara" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </Col>
          </Row>
          <Table
            rowKey="id"
            dataSource={filtered}
            columns={columns as any}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
          />
        </Card>
      </Space>
    </div>
  )
}
