import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_DEMO === '1') await import('./demo/mock')

// An email login link lands with tokens in the address. Remember that so the
// home page can forward the person to their account once they're signed in.
if (/access_token=|error_description=/.test(window.location.hash)) {
  try {
    sessionStorage.setItem('fromLoginLink', '1')
  } catch {
    /* storage blocked */
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
