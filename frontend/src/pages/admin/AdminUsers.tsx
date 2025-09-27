import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Card, Typography, Form, Input, Select, Button, Table, Space, Popconfirm, message, Row, Col } from 'antd'

// Type used for user rows
type User = { id: string; email: string; full_name: string; role: string }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Admin user management: list, create, update role/password, delete
export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [rowPasswords, setRowPasswords] = useState<Record<string, string>>({})
  const [searchEmail, setSearchEmail] = useState('')
  const [searchName, setSearchName] = useState('')

  const [form] = Form.useForm()

  // Apply simple client-side filters by email and name
  const applyFilters = (list: User[], email: string, name: string) => {
    const e = email.trim().toLowerCase()
    const n = name.trim().toLowerCase()
    return list.filter(u => (
      (!e || u.email.toLowerCase().includes(e)) &&
      (!n || (u.full_name || '').toLowerCase().includes(n))
    ))
  }

  // Load users from the API
  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<User[]>('/admin/users')
      setUsers(res.data)
      setFiltered(applyFilters(res.data, searchEmail, searchName))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setFiltered(applyFilters(users, searchEmail, searchName)) }, [users, searchEmail, searchName])

  // Create a new user (validates email and password length first)
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

  // Update a user's fields (role, name, password)
  const updateUser = async (id: string, data: Partial<{ full_name: string; password: string; role: string }>) => {
    await api.patch(`/admin/users/${id}`, data)
    await load()
    message.success('Güncellendi')
  }

  // Delete a user by id
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

  // Table columns for users management
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
        r.role === 'ADMIN' ? null : (
          <Popconfirm title="Silinsin mi?" onConfirm={() => removeUser(r.id)}>
            <Button danger>Sil</Button>
          </Popconfirm>
        )
      )
    },
  ], [rowPasswords])

  return (
    <div style={{ width: '100%' }}>
      {/* Page header */}
      <Card>
        <Typography.Title level={3} style={{ margin: 0 }}>Kullanıcı İşlemleri</Typography.Title>
      </Card>

      {/* Create user form */}
      <Card title="Kullanıcı Ekle" style={{ marginTop: 16 }}>
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

      {/* Users table and filters */}
      <Card title="Kullanıcılar" style={{ marginTop: 16 }}>
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
    </div>
  )
}


