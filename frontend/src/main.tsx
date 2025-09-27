import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd/dist/reset.css'

// App entry point: render the React application into the #root element
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
