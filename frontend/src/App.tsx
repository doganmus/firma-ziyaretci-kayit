import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme, Layout, Menu, Space, Select, Button } from 'antd'

const { Header, Content } = Layout

function isAuthed() {
  return !!localStorage.getItem('accessToken')
}

function getRole(): string | null {
  try {
    const u = localStorage.getItem('user')
    return u ? (JSON.parse(u).role as string) : null
  } catch {
    return null
  }
}

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthed()) return <Navigate to="/login" replace />
  return children
}

function Shell({ children, themeName, setThemeName }: { children: JSX.Element; themeName: string; setThemeName: (v: string) => void }) {
  const role = getRole()
  const location = useLocation()
  const items = useMemo(() => {
    const base = [
      { key: '/', label: <Link to="/">Ziyaretler</Link> },
      ...(role === 'ADMIN' || role === 'OPERATOR' ? [{ key: '/new', label: <Link to="/new">Ziyaret Ekle</Link> }] : []),
      { key: '/reports', label: <Link to="/reports">Raporlar</Link> },
      ...(role === 'ADMIN' ? [{ key: '/admin', label: <Link to="/admin">Admin</Link> }] : []),
    ]
    return base
  }, [role])

  const selectedKeys = useMemo(() => {
    const path = location.pathname
    const match = items.find((i) => path.startsWith(i.key))
    return match ? [match.key] : []
  }, [location.pathname, items])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600, marginRight: 16 }}>Firma Ziyaret</div>
        <Menu theme="dark" mode="horizontal" selectedKeys={selectedKeys} items={items} style={{ flex: 1 }} />
        <Space>
          <Select size="small" value={themeName} onChange={setThemeName} style={{ width: 100 }} options={[{ value: 'light', label: 'Açık' }, { value: 'dark', label: 'Koyu' }]} />
          <Button size="small" onClick={logout}>Çıkış</Button>
        </Space>
      </Header>
      <Content style={{ padding: 16 }}>{children}</Content>
    </Layout>
  )
}

export default function App() {
  const [themeName, setThemeName] = useState(localStorage.getItem('theme') || 'light')
  useEffect(() => {
    localStorage.setItem('theme', themeName)
  }, [themeName])

  const algorithm = themeName === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm

  const role = getRole()

  return (
    <ConfigProvider theme={{ algorithm }}>
      <BrowserRouter>
        {isAuthed() ? (
          <Shell themeName={themeName} setThemeName={setThemeName}>
            <Routes>
              <Route path="/" element={<RequireAuth><VisitList /></RequireAuth>} />
              <Route path="/new" element={<RequireAuth><VisitForm /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
              <Route path="/admin" element={role === 'ADMIN' ? <RequireAuth><Admin /></RequireAuth> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ConfigProvider>
  )
}
