import React, { useMemo, useState } from 'react'
import { Layout, Menu } from 'antd'
import { Link, Outlet, useLocation } from 'react-router-dom'

const { Sider, Content } = Layout

export default function AdminLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const selectedKeys = useMemo(() => {
    if (location.pathname.includes('/admin/branding')) return ['branding']
    return ['users']
  }, [location.pathname])

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={240} style={{ background: '#fff' }} theme="light">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={[
            { key: 'users', label: <Link to="/admin/users">Kullanıcı İşlemleri</Link> },
            { key: 'branding', label: <Link to="/admin/branding">Marka Ayarları</Link> },
          ]}
        />
      </Sider>
      <Content style={{ padding: 16 }}>
        <Outlet />
      </Content>
    </Layout>
  )
}


