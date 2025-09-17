import { useEffect, useState } from 'react'
import { api } from '../api/client'

type User = { id: string; email: string; full_name: string; role: string }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('OPERATOR')
  const [rowPasswords, setRowPasswords] = useState<Record<string, string>>({})

  const load = async () => {
    const res = await api.get<User[]>('/admin/users')
    setUsers(res.data)
  }

  useEffect(() => { load() }, [])

  const createUser = async () => {
    if (!EMAIL_RE.test(email)) { alert('Geçersiz e-posta'); return }
    if (password.length < 6) { alert('Şifre en az 6 karakter olmalı'); return }
    await api.post('/admin/users', { email, password, full_name: fullName, role })
    setEmail(''); setFullName(''); setPassword(''); setRole('OPERATOR')
    await load()
  }

  const updateUser = async (id: string, data: Partial<{ full_name: string; password: string; role: string }>) => {
    await api.patch(`/admin/users/${id}`, data)
    await load()
  }

  const removeUser = async (id: string) => {
    await api.delete(`/admin/users/${id}`)
    await load()
  }

  const setRowPassword = (id: string, val: string) => setRowPasswords(prev => ({ ...prev, [id]: val }))
  const saveRowPassword = async (id: string) => {
    const p = rowPasswords[id] || ''
    if (p.length < 6) { alert('Şifre en az 6 karakter olmalı'); return }
    await updateUser(id, { password: p })
    setRowPasswords(prev => ({ ...prev, [id]: '' }))
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin - Kullanıcı Yönetimi</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ADMIN">ADMIN</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="VIEWER">VIEWER</option>
        </select>
        <button onClick={createUser}>Ekle</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th>E-posta</th><th>Ad Soyad</th><th>Rol</th><th>Şifre</th><th>Aksiyon</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.full_name}</td>
              <td>
                <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </td>
              <td>
                <input type="password" placeholder="Yeni şifre" value={rowPasswords[u.id] || ''} onChange={(e) => setRowPassword(u.id, e.target.value)} />
                <button onClick={() => saveRowPassword(u.id)}>Kaydet</button>
              </td>
              <td>
                <button onClick={() => removeUser(u.id)}>Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
