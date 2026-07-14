import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/barlow-semi-condensed/latin-800.css'
import './index.css'
import App from './App.tsx'
import { bootstrapThemePreference } from './lib/themePreference'

bootstrapThemePreference()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
