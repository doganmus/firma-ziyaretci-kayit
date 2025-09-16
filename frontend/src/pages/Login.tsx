import { useState } from 'react'
import { api, LoginResponse } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password })
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/'
    } catch (err) {
      setError('Giriş başarısız')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Giriş Yap</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>E-posta</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Şifre</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit">Giriş</button>
      </form>
    </div>
  )
}
