import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { tauriAPI } from './tauri-api'

window.electronAPI = tauriAPI

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
