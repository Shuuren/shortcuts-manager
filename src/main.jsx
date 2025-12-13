import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { HistoryProvider } from './context/HistoryContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <HistoryProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HistoryProvider>
    </AuthProvider>
  </StrictMode>,
)
