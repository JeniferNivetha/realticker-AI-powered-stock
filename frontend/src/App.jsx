import { useState, useEffect, useCallback } from 'react'
import Navbar    from './components/Navbar'
import Dashboard from './components/Dashboard'
import StockDetail from './components/StockDetail'
import './index.css'

/**
 * Root component — manages which detail panel (if any) is open.
 * Keeping this dead-simple; no router needed for a single-page hackathon app.
 */
export default function App() {
  const [activeTicker, setActiveTicker] = useState(null)

  // prevent body from scrolling when the detail panel is open
  useEffect(() => {
    document.body.style.overflow = activeTicker ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeTicker])

  const openDetail  = useCallback((ticker) => setActiveTicker(ticker), [])
  const closeDetail = useCallback(() => setActiveTicker(null), [])

  return (
    <>
      <Navbar />

      <Dashboard onSelectTicker={openDetail} />

      {activeTicker && (
        <StockDetail
          ticker={activeTicker}
          onClose={closeDetail}
        />
      )}

      <footer className="footer">
        <div className="footer-brand">SORIM.Ai · RealTicker</div>
        <p className="footer-text">
          Hackathon Technical Assessment &nbsp;·&nbsp;
          AI-Powered Stock Insights &nbsp;·&nbsp;
          <span style={{ color: 'var(--accent-amber)' }}>
            ⚠ Not financial advice
          </span>
        </p>
      </footer>
    </>
  )
}
