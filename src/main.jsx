import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './AdminApp.jsx'
import './styles.css'

const root = createRoot(document.getElementById('root'))
root.render(
  window.location.pathname === '/admin' ? <AdminApp /> : <App />
)
