import { useState } from 'react'
import { api, LoginResponse } from '../api/client'
import { Form, Input, Button, Typography, Card, Alert, Space, Tooltip } from 'antd'
import { MailOutlined, LockOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'

export default function Login({ themeName = 'light', onToggleTheme }: { themeName?: 'light' | 'dark'; onToggleTheme?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null)
    try {
      setLoading(true)
      const res = await api.post<LoginResponse>('/auth/login', values)
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/'
    } catch {
      setError('Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 440, margin: '80px auto', position: 'relative' }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <Tooltip title={themeName === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}>
          <Button
            shape="circle"
            size="large"
            aria-label="Tema"
            onClick={onToggleTheme}
            style={{
              backgroundColor: themeName === 'dark' ? '#fff' : '#000',
              color: themeName === 'dark' ? '#000' : '#fff',
              border: 'none'
            }}
            icon={themeName === 'dark' ? <SunOutlined style={{ fontSize: 20 }} /> : <MoonOutlined style={{ fontSize: 20 }} />}
          />
        </Tooltip>
      </div>
      <Card>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Giriş Yap</Typography.Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off" initialValues={{ email: '', password: '' }}>
          <Form.Item label="E-posta" name="email" rules={[{ required: true, message: 'E-posta gerekli' }, { type: 'email', message: 'Geçerli bir e-posta girin' }]}>
            <Input prefix={<MailOutlined />} placeholder="admin@example.com" type="email" autoComplete="email" size="large" />
          </Form.Item>
          <Form.Item label="Şifre" name="password" rules={[{ required: true, message: 'Şifre gerekli' }, { min: 6, message: 'En az 6 karakter' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Şifreniz" autoComplete="current-password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>Giriş</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
