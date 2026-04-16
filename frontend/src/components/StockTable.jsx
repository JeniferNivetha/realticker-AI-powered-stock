function formatVolume(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v;
}

function formatPrice(p) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p);
}

export default function StockTable({ stocks, maxVolume, onSelect }) {
  return (
    <div className="table-wrapper fade-in">
      <table className="stock-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Ticker</th>
            <th>Price</th>
            <th>Change %</th>
            <th>Volume</th>
            <th>Sector</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, idx) => (
            <tr
              key={s.ticker}
              id={`row-${s.ticker}`}
              onClick={() => onSelect(s.ticker)}
              className={`stagger-${Math.min(idx + 1, 5)}`}
              style={{ animationDelay: `${idx * 0.04}s`, opacity: 0, animation: `slideUp 0.4s ease ${idx * 0.04}s forwards` }}
            >
              {/* Rank */}
              <td>
                <div className="rank-badge">{idx + 1}</div>
              </td>

              {/* Ticker + Company */}
              <td>
                <div className="ticker-cell">
                  <div className="ticker-icon">{s.ticker.slice(0, 3)}</div>
                  <div>
                    <div className="ticker-sym">{s.ticker}</div>
                    <div className="company-name">{s.company}</div>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td>
                <span className="price-cell">{formatPrice(s.price)}</span>
              </td>

              {/* Change */}
              <td>
                <span className={`change-badge ${s.change >= 0 ? 'positive' : 'negative'}`}>
                  {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
                </span>
              </td>

              {/* Volume bar */}
              <td>
                <div className="volume-bar-wrap">
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', minWidth: 40 }}>
                    {formatVolume(s.volume)}
                  </span>
                  <div className="volume-bar-bg">
                    <div
                      className="volume-bar-fill"
                      style={{ width: `${(s.volume / maxVolume) * 100}%` }}
                    />
                  </div>
                </div>
              </td>

              {/* Sector */}
              <td>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {s.sector || 'N/A'}
                </span>
              </td>

              {/* Action */}
              <td onClick={e => e.stopPropagation()}>
                <button
                  id={`analyze-${s.ticker}`}
                  className="analyze-btn"
                  onClick={() => onSelect(s.ticker)}
                >
                  🔍 Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
