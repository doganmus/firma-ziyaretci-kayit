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
import { SunOutlined, MoonOutlined, MenuOutlined, FormOutlined, UnorderedListOutlined, BarChartOutlined, SettingOutlined, TeamOutlined, PictureOutlined } from '@ant-design/icons'

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
  const [siderCollapsed, setSiderCollapsed] = useState(false)
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
      items.push({ key: '/', icon: <FormOutlined />, label: <Link to="/">Kayıt</Link>, title: 'Kayıt' })
    }
    items.push({ key: '/list', icon: <UnorderedListOutlined />, label: <Link to="/list">Kayıtlar</Link>, title: 'Kayıtlar' })
    items.push({ key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">Rapor</Link>, title: 'Rapor' })
    if (role === 'ADMIN') {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'Admin',
        children: [
          { key: '/admin/users', icon: <TeamOutlined />, label: <Link to="/admin/users">Kullanıcı İşlemleri</Link>, title: 'Kullanıcı İşlemleri' },
          { key: '/admin/branding', icon: <PictureOutlined />, label: <Link to="/admin/branding">Marka Ayarları</Link>, title: 'Marka Ayarları' },
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

  const [openKeys, setOpenKeys] = useState<string[]>(location.pathname.startsWith('/admin') ? ['admin'] : [])
  useEffect(() => {
    setOpenKeys(!siderCollapsed && location.pathname.startsWith('/admin') ? ['admin'] : [])
  }, [location.pathname, siderCollapsed])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  const headerBg = themeName === 'dark' ? '#001529' : '#fff'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={siderCollapsed} onCollapse={setSiderCollapsed} trigger={null} width={240} theme={themeName === 'dark' ? 'dark' : 'light'}>
        <div style={{ height: 64, background: headerBg, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
          <Button
            type="text"
            onClick={() => setSiderCollapsed((c) => !c)}
            icon={<MenuOutlined style={{ fontSize: 20, color: '#fff' }} />}
            style={{ height: 48, width: 48 }}
          />
        </div>
        <Menu
          mode="inline"
          theme={themeName === 'dark' ? 'dark' : 'light'}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          inlineCollapsed={siderCollapsed}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: headerBg }}>
          <Space>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="Logo" style={{ height: 28 }} />
            ) : (
              <div style={{ fontWeight: 600, color: themeName === 'dark' ? '#fff' : '#000' }}>{brand.name || 'Firma'}</div>
            )}
          </Space>
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
