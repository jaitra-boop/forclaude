import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// In a browser (non-Electron) context window.loupe won't exist — load the
// localStorage-backed mock so the full UI works on localhost.
if (!window.loupe) {
  await import('./browserMock.js')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
