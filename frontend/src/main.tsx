import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Firma Ziyaretçi Kayıt</h1>
      <p>Frontend iskeleti hazır. API: {import.meta.env.VITE_API_URL || 'not set'}</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
