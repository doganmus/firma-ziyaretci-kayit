import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'
import Reports from './pages/Reports'

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

  return (
    <BrowserRouter>
      {isAuthed() && (
        <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
          <Link to="/">Ziyaretler</Link>
          {(role === 'ADMIN' || role === 'OPERATOR') && <Link to="/new">Ziyaret Ekle</Link>}
          <Link to="/reports">Raporlar</Link>
          <span style={{ marginLeft: 'auto' }} />
          <button onClick={logout}>Çıkış</button>
        </nav>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><VisitList /></RequireAuth>} />
        <Route path="/new" element={<RequireAuth><VisitForm /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
        <Route path="*" element={isAuthed() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
