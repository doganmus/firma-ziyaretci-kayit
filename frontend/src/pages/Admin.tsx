import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { Card, Typography, Form, Input, Select, Button, Table, Space, Popconfirm, message } from 'antd'

type User = { id: string; email: string; full_name: string; role: string }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [rowPasswords, setRowPasswords] = useState<Record<string, string>>({})

  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<User[]>('/admin/users')
      setUsers(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
    { title: 'E-posta', dataIndex: 'email', key: 'email' },
    { title: 'Ad Soyad', dataIndex: 'full_name', key: 'full_name' },
    {
      title: 'Rol', dataIndex: 'role', key: 'role', render: (v: string, r: User) => (
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
          <Table
            rowKey="id"
            dataSource={users}
            columns={columns as any}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>
    </div>
  )
}
