import React from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'
import AdminLayout from './pages/admin/AdminLayout'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBrand from './pages/admin/AdminBrand'
import AdminAudit from './pages/admin/AdminAudit'
import AdminOps from './pages/admin/AdminOps'
import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme, Layout, Menu, Space, Button, Tooltip, Dropdown, Modal, Form as AntForm, Input as AntInput, message, Divider, Switch as AntSwitch, Alert } from 'antd'
import { api } from './api/client'
import { SunOutlined, MoonOutlined, MenuOutlined, LogoutOutlined, UserOutlined, FormOutlined, UnorderedListOutlined, BarChartOutlined, SettingOutlined, TeamOutlined, PictureOutlined } from '@ant-design/icons'

const { Header, Content, Sider } = Layout

// Checks if a JWT token exists (meaning user is logged in)
function isAuthed() {
  return !!localStorage.getItem('accessToken')
}

// Reads the current user's role from localStorage (if present)
function getRole(): string | null {
  try {
    const u = localStorage.getItem('user')
    return u ? (JSON.parse(u).role as string) : null
  } catch {
    return null
  }
}

// Wrapper that redirects to login if user is not authenticated
function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthed()) return <Navigate to="/login" replace />
  return children
}

// App shell with sidebar navigation, header, theme toggle, and branding
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
  const [maintenance, setMaintenance] = useState(false)
  // React to brand changes fired from AdminBrand
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
  // Load public settings (maintenance flag) once
  useEffect(() => {
    ;(async () => {
      try {
        const s = await api.get('/settings/public')
        setMaintenance(!!s.data.maintenanceMode)
      } catch {}
    })()
  }, [])
  // Build sidebar items based on user role
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
          { key: '/admin/audit', icon: <PictureOutlined />, label: <Link to="/admin/audit">Audit Log</Link>, title: 'Audit Log' },
          { key: '/admin/ops', icon: <SettingOutlined />, label: <Link to="/admin/ops">Sistem Yönetimi</Link>, title: 'Sistem Yönetimi' },
        ],
      })
    }
    return items
  }, [role])

  // Keep menu selection in sync with current route
  const selectedKeys = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/admin/')) return [path]
    if (path === '/') return ['/']
    const keys = ['/', '/list', '/reports']
    const found = keys.find((k) => k !== '/' && path.startsWith(k))
    return found ? [found] : []
  }, [location.pathname])

  // Open the Admin submenu only when on admin routes and not collapsed
  const [openKeys, setOpenKeys] = useState<string[]>(location.pathname.startsWith('/admin') ? ['admin'] : [])
  useEffect(() => {
    setOpenKeys(!siderCollapsed && location.pathname.startsWith('/admin') ? ['admin'] : [])
  }, [location.pathname, siderCollapsed])

  // Logout clears session and redirects to login
  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  // Toggle between light and dark theme
  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  const headerBg = themeName === 'dark' ? '#001529' : '#fff'

  // Profile dropdown and modals state
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [pwdForm] = AntForm.useForm<{ currentPassword: string; newPassword: string; confirm: string }>()

  // A11y: Skip link to jump to main content
  const [showSkip, setShowSkip] = useState(false)
  const mainRef = React.useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // Focus main on route change for keyboard readers
    if (mainRef.current) {
      setTimeout(() => {
        mainRef.current?.focus()
      }, 0)
    }
    // Update document title by route
    const path = location.pathname
    const map: Record<string, string> = { '/': 'Kayıt', '/list': 'Kayıtlar', '/reports': 'Rapor' }
    const title = path.startsWith('/admin') ? 'Admin' : (map[path] || 'Uygulama')
    try { document.title = `${title} · Ziyaretçi Kayıt` } catch {}
  }, [location.pathname])

  const onPasswordSubmit = async () => {
    try {
      const vals = await pwdForm.validateFields()
      if ((vals.newPassword || '').length < 6) {
        message.error('Yeni şifre en az 6 karakter olmalı');
        return
      }
      if (vals.newPassword !== vals.confirm) {
        message.error('Yeni şifre ve tekrar aynı olmalı');
        return
      }
      setPwdLoading(true)
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify({ currentPassword: vals.currentPassword, newPassword: vals.newPassword }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Şifre değiştirilemedi')
      }
      message.success('Şifre güncellendi')
      setPwdOpen(false)
      pwdForm.resetFields()
    } catch (e: any) {
      if (e?.errorFields) return // form validation error
      message.error(e?.message || 'İşlem başarısız')
    } finally {
      setPwdLoading(false)
    }
  }

  const profileMenu = {
    items: [
      { key: 'pwd', label: 'Şifre Değiştir' },
      { type: 'divider' as const },
      { key: 'session', label: 'Oturum Ayarları' },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'pwd') setPwdOpen(true)
      if (key === 'session') setSessionOpen(true)
    },
  }

  return (
    <>
      <style>{`
        :focus-visible { outline: 3px solid #1677ff; outline-offset: 2px; }
        a.skip-link{ position:absolute; left:-9999px; }
        a.skip-link:focus{ left:8px; top:8px; background:#1677ff; color:#fff; padding:6px 10px; border-radius:4px; z-index:1000; text-decoration:none; }
      `}</style>
      <Layout style={{ minHeight: '100vh' }}>
      <a className="skip-link" href="#mainContent">
        İçeriğe atla
      </a>
      <Sider collapsible collapsed={siderCollapsed} onCollapse={setSiderCollapsed} trigger={null} width={200} theme={themeName === 'dark' ? 'dark' : 'light'}>
        <div style={{ height: 64, background: headerBg, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
          <Button
            type="text"
            aria-label="Menü"
            onClick={() => setSiderCollapsed((c) => !c)}
            icon={<MenuOutlined style={{ fontSize: 20, color: themeName === 'dark' ? '#fff' : '#000' }} />}
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
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: headerBg, padding: '0 8px' }}>
          <Space size={4}>
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
            <Dropdown menu={profileMenu} placement="bottomRight" trigger={['click']}>
              <Button type="text" icon={<UserOutlined />} style={{ color: themeName === 'dark' ? '#fff' : '#000' }}>
                Profil
              </Button>
            </Dropdown>
            <Tooltip title="Çıkış">
              <Button
                type="primary"
                onClick={logout}
                icon={<LogoutOutlined />}
              >
                Çıkış
              </Button>
            </Tooltip>
          </Space>
        </Header>
        <Modal
          open={pwdOpen}
          title="Şifre Değiştir"
          onOk={onPasswordSubmit}
          okText="Kaydet"
          cancelText="İptal"
          onCancel={() => setPwdOpen(false)}
          confirmLoading={pwdLoading}
        >
          <AntForm form={pwdForm} layout="vertical">
            <AntForm.Item name="currentPassword" label="Mevcut Şifre" rules={[{ required: true, message: 'Zorunlu alan' }]}>
              <AntInput.Password autoComplete="current-password" />
            </AntForm.Item>
            <AntForm.Item name="newPassword" label="Yeni Şifre" rules={[{ required: true, message: 'Zorunlu alan' }, { min: 6, message: 'En az 6 karakter' }]}>
              <AntInput.Password autoComplete="new-password" />
            </AntForm.Item>
            <AntForm.Item name="confirm" label="Yeni Şifre (Tekrar)" dependencies={["newPassword"]} rules={[{ required: true, message: 'Zorunlu alan' }]}>
              <AntInput.Password autoComplete="new-password" />
            </AntForm.Item>
          </AntForm>
        </Modal>
        <Modal
          open={sessionOpen}
          title="Oturum Ayarları"
          onOk={() => setSessionOpen(false)}
          okText="Kapat"
          cancelButtonProps={{ style: { display: 'none' } }}
          onCancel={() => setSessionOpen(false)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>Tema</div>
            <AntSwitch
              checked={themeName === 'dark'}
              onChange={(checked) => setThemeName(checked ? 'dark' : 'light')}
              checkedChildren="Koyu"
              unCheckedChildren="Açık"
            />
          </div>
          <Divider />
          <Button danger onClick={logout} icon={<LogoutOutlined />}>Oturumu Kapat</Button>
        </Modal>
        <Content id="mainContent" role="main" tabIndex={-1} ref={mainRef as any} aria-label="Ana içerik" style={{ padding: 16 }}>
          {maintenance && role !== 'ADMIN' && (
            <Alert
              type="warning"
              showIcon
              banner
              message="Sistem bakım modunda, değişiklik yapılamaz. Görünüm kısıtlıdır."
              style={{ marginBottom: 12 }}
            />
          )}
          {children}
        </Content>
      </Layout>
    </Layout>
    </>
  )
}

export default function App() {
  // Remember the selected theme in localStorage
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

  // Select Ant Design theme algorithm (light/dark)
  const algorithm = themeName === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm

  const role = getRole()

  const toggleTheme = () => setThemeName(themeName === 'dark' ? 'light' : 'dark')

  // Only ADMIN/OPERATOR can access the visit creation form
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
                <Route path="audit" element={<AdminAudit />} />
                <Route path="ops" element={<AdminOps />} />
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
