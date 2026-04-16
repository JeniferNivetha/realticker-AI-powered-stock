import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-accent)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: '0.82rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ color: 'var(--accent-blue-light)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        ${payload[0]?.value?.toFixed(2)}
      </div>
      {d && (
        <>
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            H: ${d.high?.toFixed(2)} · L: ${d.low?.toFixed(2)}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            Vol: {d.volume ? (d.volume / 1e6).toFixed(1) + 'M' : '--'}
          </div>
        </>
      )}
    </div>
  );
};

export default function StockChart({ history }) {
  if (!history?.length) return null;

  // Sample to ~90 data points max for performance
  const step    = Math.max(1, Math.floor(history.length / 90));
  const data    = history.filter((_, i) => i % step === 0).map(r => ({
    ...r,
    date:  r.date.slice(5),   // "MM-DD"
    close: r.close,
  }));

  const firstClose = data[0]?.close || 0;
  const lastClose  = data[data.length - 1]?.close || 0;
  const isUp       = lastClose >= firstClose;
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillStart   = isUp ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)';

  const prices = data.map(d => d.close);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>Low: <strong style={{ color: 'var(--accent-red)' }}>${minP.toFixed(2)}</strong></span>
        <span>High: <strong style={{ color: 'var(--accent-green)'}}>${maxP.toFixed(2)}</strong></span>
        <span>Δ: <strong style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {isUp ? '+' : ''}{(((lastClose - firstClose) / firstClose) * 100).toFixed(2)}%
        </strong></span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${v}`}
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={firstClose}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#chartGrad)"
            dot={false}
            activeDot={{ r: 5, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
