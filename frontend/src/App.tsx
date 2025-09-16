import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import VisitForm from './pages/VisitForm'
import VisitList from './pages/VisitList'

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/">Ziyaretler</Link>
        <Link to="/new">Ziyaret Ekle</Link>
        <span style={{ marginLeft: 'auto' }} />
        <button onClick={logout}>Çıkış</button>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><VisitList /></RequireAuth>} />
        <Route path="/new" element={<RequireAuth><VisitForm /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
