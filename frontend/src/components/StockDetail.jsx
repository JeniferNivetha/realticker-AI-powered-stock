import { useState, useEffect, useCallback } from 'react';
import { fetchStockHistory } from '../api';
import StockChart from './StockChart';
import AnalysisPanel from './AnalysisPanel';
import LoadingSpinner from './LoadingSpinner';
import ErrorState from './ErrorState';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtVol(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v;
}
function fmtCap(v) {
  if (!v) return 'N/A';
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
  if (v >= 1e9)  return '$' + (v / 1e9).toFixed(2) + 'B';
  return '$' + (v / 1e6).toFixed(2) + 'M';
}

export default function StockDetail({ ticker, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('chart'); // 'chart' | 'analysis'

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchStockHistory(ticker);
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load stock detail');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const stock = data?.current;
  const history = data?.history || [];
  const isUp = stock?.change >= 0;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-title-row">
            <div className="detail-ticker-icon">{ticker.slice(0, 3)}</div>
            <div>
              <div className="detail-ticker">{ticker}</div>
              <div className="detail-company">{data?.company || '…'}</div>
            </div>
            {stock && (
              <div style={{ marginLeft: 16 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800,
                  color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {fmt(stock.price)}
                </div>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 600,
                  color: isUp ? 'var(--accent-green)' : 'var(--accent-red)',
                }}>
                  {isUp ? '▲' : '▼'} {Math.abs(stock.change)}% today
                </div>
              </div>
            )}
          </div>
          <button id={`close-detail-${ticker}`} className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="detail-body">
          {loading && <LoadingSpinner message={`Loading ${ticker} data…`} />}
          {error   && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && stock && (
            <>
              {/* Metrics grid */}
              <div className="metrics-grid">
                {[
                  { label: 'Current Price', value: fmt(stock.price), cls: '' },
                  { label: 'Daily Change',  value: `${stock.change >= 0 ? '+' : ''}${stock.change}%`, cls: isUp ? 'green' : 'red' },
                  { label: 'Volume',        value: fmtVol(stock.volume), cls: '' },
                  { label: 'Market Cap',    value: fmtCap(stock.marketCap), cls: '' },
                  { label: 'Sector',        value: stock.sector || 'N/A', cls: '' },
                  { label: '6M Data Pts',   value: history.length, cls: '' },
                ].map((m, i) => (
                  <div key={i} className="metric-card">
                    <div className="metric-label">{m.label}</div>
                    <div className={`metric-value ${m.cls}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['chart', 'analysis'].map(t => (
                  <button
                    key={t}
                    id={`tab-${t}-${ticker}`}
                    onClick={() => setTab(t)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: `1px solid ${tab === t ? 'var(--accent-blue)' : 'var(--border)'}`,
                      background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: tab === t ? 'var(--accent-blue-light)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'var(--font-main)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t === 'chart' ? '📊 Price Chart' : '🤖 AI Analysis'}
                  </button>
                ))}
              </div>

              {/* Chart tab */}
              {tab === 'chart' && (
                <div className="chart-section fade-in">
                  <div className="chart-header">
                    <div className="chart-title">6-Month Price History</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {history.length > 0 && `${history[0].date} → ${history[history.length - 1].date}`}
                    </div>
                  </div>
                  <StockChart history={history} />

                  {/* Mini OHLC table — last 5 entries */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Recent Price Data
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(-5).reverse().map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{row.date}</td>
                            <td style={{ padding: '8px 10px' }}>${row.open}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--accent-green)' }}>${row.high}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--accent-red)' }}>${row.low}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>${row.close}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{fmtVol(row.volume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Analysis tab */}
              {tab === 'analysis' && (
                <div className="fade-in">
                  <AnalysisPanel ticker={ticker} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
