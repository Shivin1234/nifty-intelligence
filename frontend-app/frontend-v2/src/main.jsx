import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TradingDashboard from './TradingDashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TradingDashboard />
  </StrictMode>,
)