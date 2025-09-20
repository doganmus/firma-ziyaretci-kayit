import React from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme, Layout, Menu, Space, Button, Tooltip, Image } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'

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
  const [brand, setBrand] = useState<{ name: string | null; logoUrl: string | null }>({ name: null, logoUrl: null })

  useEffect(() => {
    // Load settings if authed; admin endpoint requires ADMIN but we can cache brand in localStorage when Admin updates.
    try {
      const cached = localStorage.getItem('brandSettings')
      if (cached) {
        const s = JSON.parse(cached)
        setBrand({ name: s.brandName ?? null, logoUrl: s.brandLogoUrl ?? null })
      }
    } catch {}
  }, [])
  const items = useMemo(() => {
    const base = [
      ...(role === 'ADMIN' || role === 'OPERATOR' ? [{ key: '/', label: <Link to="/">Kayıt</Link> }] : []),
      { key: '/list', label: <Link to="/list">Kayıtlar</Link> },
      { key: '/reports', label: <Link to="/reports">Rapor</Link> },
      ...(role === 'ADMIN' ? [{ key: '/admin', label: <Link to="/admin">Admin</Link> }] : []),
    ]
    return base
  }, [role])

  const selectedKeys = useMemo(() => {
    const path = location.pathname
    if (path === '/') return ['/']
    const match = items.find((i) => i.key !== '/' && path.startsWith(i.key))
    return match ? [match.key] : []
  }, [location.pathname, items])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="Logo" style={{ height: 28 }} />
          ) : (
            <div style={{ color: '#fff', fontWeight: 600 }}>{brand.name || 'Firma'}</div>
          )}
        </div>
        <Menu theme="dark" mode="horizontal" selectedKeys={selectedKeys} items={items} style={{ flex: 1 }} />
        <Space>
          <Tooltip title={themeName === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}>
            <Button
              shape="circle"
              size="large"
              aria-label="Tema"
              onClick={toggleTheme}
              style={{
                backgroundColor: themeName === 'dark' ? '#fff' : '#000',
                color: themeName === 'dark' ? '#000' : '#fff',
                border: 'none'
              }}
              icon={themeName === 'dark' ? <SunOutlined style={{ fontSize: 18 }} /> : <MoonOutlined style={{ fontSize: 18 }} />}
            />
          </Tooltip>
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
    try {
      document.documentElement.setAttribute('data-theme', themeName)
    } catch {}
  }, [themeName])

  // React to brand settings change (from Admin)
  useEffect(() => {
    const handler = () => {
      try {
        const cached = localStorage.getItem('brandSettings')
        if (cached) {
          const s = JSON.parse(cached)
          // Force rerender by toggling themeName to same value
          setThemeName((prev) => prev)
        }
      } catch {}
    }
    window.addEventListener('brandSettingsChanged', handler as any)
    return () => window.removeEventListener('brandSettingsChanged', handler as any)
  }, [])

  const algorithm = themeName === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm

  const role = getRole()

  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  const canCreate = role === 'ADMIN' || role === 'OPERATOR'

  return (
    <ConfigProvider theme={{ algorithm }}>
      <BrowserRouter>
        {isAuthed() ? (
          <Shell themeName={themeName} setThemeName={setThemeName}>
            <Routes>
              <Route path="/" element={canCreate ? <RequireAuth><VisitForm /></RequireAuth> : <Navigate to="/list" replace />} />
              <Route path="/list" element={<RequireAuth><VisitList /></RequireAuth>} />
              <Route path="/new" element={<Navigate to="/" replace />} />
              <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
              <Route path="/admin" element={role === 'ADMIN' ? <RequireAuth><Admin /></RequireAuth> : <Navigate to="/list" replace />} />
              <Route path="*" element={<Navigate to={canCreate ? '/' : '/list'} replace />} />
            </Routes>
          </Shell>
        ) : (
          <Routes>
            <Route path="/login" element={<Login themeName={themeName as 'light' | 'dark'} onToggleTheme={toggleTheme} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </ConfigProvider>
  )
}
