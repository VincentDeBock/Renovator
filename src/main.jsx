import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Root from './Root.jsx'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './i18n'
import EasterEgg from './components/EasterEgg'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
        <EasterEgg />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
