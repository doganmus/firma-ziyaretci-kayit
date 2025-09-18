import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import { useEffect, useState } from 'react'
import { ConfigProvider, theme } from 'antd'

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

export default function App() {
  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const role = getRole()
  const [themeName, setThemeName] = useState(localStorage.getItem('theme') || 'light')
  useEffect(() => {
    localStorage.setItem('theme', themeName)
  }, [themeName])

  const algorithm = themeName === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm

  return (
    <ConfigProvider theme={{ algorithm }}>
      <BrowserRouter>
        {isAuthed() && (
          <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid var(--border-color)' }}>
            <Link to="/">Ziyaretler</Link>
            {(role === 'ADMIN' || role === 'OPERATOR') && <Link to="/new">Ziyaret Ekle</Link>}
            <Link to="/reports">Raporlar</Link>
            {role === 'ADMIN' && <Link to="/admin">Admin</Link>}
            <span style={{ marginLeft: 'auto' }} />
            <select value={themeName} onChange={(e) => setThemeName(e.target.value)}>
              <option value="light">Açık</option>
              <option value="dark">Koyu</option>
            </select>
            <button onClick={logout}>Çıkış</button>
          </nav>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><VisitList /></RequireAuth>} />
          <Route path="/new" element={<RequireAuth><VisitForm /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/admin" element={role === 'ADMIN' ? <RequireAuth><Admin /></RequireAuth> : <Navigate to="/" replace />} />
          <Route path="*" element={isAuthed() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
