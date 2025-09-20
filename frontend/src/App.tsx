import React from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'
import AdminLayout from './pages/admin/AdminLayout'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBrand from './pages/admin/AdminBrand'
import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme, Layout, Menu, Space, Button, Tooltip } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'

const { Header, Content, Sider } = Layout

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
  const [brand, setBrand] = useState<{ name: string | null; logoUrl: string | null }>(() => {
    try {
      const cached = localStorage.getItem('brandSettings')
      if (cached) {
        const s = JSON.parse(cached)
        return { name: s.brandName ?? null, logoUrl: s.brandLogoUrl ?? null }
      }
    } catch {}
    return { name: null, logoUrl: null }
  })
  useEffect(() => {
    const handler = () => {
      try {
        const cached = localStorage.getItem('brandSettings')
        if (cached) {
          const s = JSON.parse(cached)
          setBrand({ name: s.brandName ?? null, logoUrl: s.brandLogoUrl ?? null })
        } else {
          setBrand({ name: null, logoUrl: null })
        }
      } catch {}
    }
    window.addEventListener('brandSettingsChanged', handler as any)
    return () => window.removeEventListener('brandSettingsChanged', handler as any)
  }, [])
  const menuItems = useMemo(() => {
    const items: any[] = []
    if (role === 'ADMIN' || role === 'OPERATOR') {
      items.push({ key: '/', label: <Link to="/">Kayıt</Link> })
    }
    items.push({ key: '/list', label: <Link to="/list">Kayıtlar</Link> })
    items.push({ key: '/reports', label: <Link to="/reports">Rapor</Link> })
    if (role === 'ADMIN') {
      items.push({
        key: 'admin',
        label: 'Admin',
        children: [
          { key: '/admin/users', label: <Link to="/admin/users">Kullanıcı İşlemleri</Link> },
          { key: '/admin/branding', label: <Link to="/admin/branding">Marka Ayarları</Link> },
        ],
      })
    }
    return items
  }, [role])

  const selectedKeys = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/admin/')) return [path]
    if (path === '/') return ['/']
    const keys = ['/', '/list', '/reports']
    const found = keys.find((k) => k !== '/' && path.startsWith(k))
    return found ? [found] : []
  }, [location.pathname])

  const openKeys = useMemo(() => {
    return location.pathname.startsWith('/admin') ? ['admin'] : []
  }, [location.pathname])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme={themeName === 'dark' ? 'dark' : 'light'}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="Logo" style={{ height: 28 }} />
          ) : (
            <div style={{ fontWeight: 600, color: themeName === 'dark' ? '#fff' : '#000' }}>{brand.name || 'Firma'}</div>
          )}
        </div>
        <Menu
          mode="inline"
          theme={themeName === 'dark' ? 'dark' : 'light'}
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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
          // Nothing else required; Shell reads from localStorage on mount. Force a rerender:
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
              <Route path="/admin" element={role === 'ADMIN' ? <RequireAuth><AdminLayout /></RequireAuth> : <Navigate to="/list" replace />}>
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="branding" element={<AdminBrand />} />
              </Route>
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
