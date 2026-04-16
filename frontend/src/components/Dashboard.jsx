import { useState, useEffect, useCallback } from 'react';
import { fetchTop10Stocks } from '../api';
import StockTable from './StockTable';
import LoadingSpinner from './LoadingSpinner';
import ErrorState from './ErrorState';

export default function Dashboard({ onSelectTicker }) {
  const [stocks, setStocks]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStocks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await fetchTop10Stocks();
      setStocks(data.stocks);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to fetch stocks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStocks(); }, [loadStocks]);

  const maxVolume = stocks.length ? Math.max(...stocks.map(s => s.volume)) : 1;
  const totalMarketCap = stocks.reduce((a, s) => a + (s.marketCap || 0), 0);
  const gainers  = stocks.filter(s => s.change > 0).length;
  const avgChange = stocks.length
    ? (stocks.reduce((a, s) => a + s.change, 0) / stocks.length).toFixed(2)
    : 0;

  return (
    <main className="container" style={{ paddingTop: 0, paddingBottom: 32 }}>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-label">🤖 Powered by HuggingFace AI · Real-time Data</div>
        <h1>
          Market Intelligence,<br />
          <span className="gradient-text">Reimagined with AI</span>
        </h1>
        <p className="hero-sub">
          Track the top 10 stocks by volume, dive deep into 6-month trends,
          and get AI-powered investment insights in seconds.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">10</div>
            <div className="hero-stat-label">Top Stocks</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">6mo</div>
            <div className="hero-stat-label">History</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{gainers}</div>
            <div className="hero-stat-label">Gainers</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value" style={{ color: avgChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {avgChange >= 0 ? '+' : ''}{avgChange}%
            </div>
            <div className="hero-stat-label">Avg Change</div>
          </div>
        </div>
      </section>

      {/* ── Market Overview Cards ── */}
      {stocks.length > 0 && (
        <div className="slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Top Gainer', value: (() => { const g = [...stocks].sort((a,b) => b.change - a.change)[0]; return g ? `${g.ticker} +${g.change}%` : '--'; })(), icon: '🚀', color: 'var(--accent-green)' },
            { label: 'Top Loser',  value: (() => { const l = [...stocks].sort((a,b) => a.change - b.change)[0]; return l ? `${l.ticker} ${l.change}%` : '--'; })(), icon: '📉', color: 'var(--accent-red)' },
            { label: 'Highest Volume', value: (() => { const h = [...stocks].sort((a,b) => b.volume - a.volume)[0]; return h ? `${h.ticker} ${(h.volume/1e6).toFixed(0)}M` : '--'; })(), icon: '📊', color: 'var(--accent-cyan)' },
            { label: 'Market Sentiment', value: gainers >= 6 ? 'Bullish 🟢' : gainers <= 4 ? 'Bearish 🔴' : 'Neutral 🟡', icon: '🧠', color: 'var(--accent-purple)' },
          ].map((card, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table Section ── */}
      <div className="section-header">
        <div>
          <div className="section-title">Top 10 Stocks</div>
          <div className="section-subtitle">
            {lastUpdated ? `Last updated ${lastUpdated}` : 'Ranked by trading volume'}
          </div>
        </div>
        <button
          id="refresh-btn"
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={() => loadStocks(true)}
          disabled={refreshing || loading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading  && <LoadingSpinner message="Fetching live stock data…" />}
      {error    && <ErrorState message={error} onRetry={() => loadStocks()} />}
      {!loading && !error && (
        <StockTable
          stocks={stocks}
          maxVolume={maxVolume}
          onSelect={onSelectTicker}
        />
      )}
    </main>
  );
}
