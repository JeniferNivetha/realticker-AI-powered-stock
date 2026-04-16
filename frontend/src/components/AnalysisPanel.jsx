import { useState } from 'react';
import { analyzeStock } from '../api';

function trendClass(v = '') {
  const l = v.toLowerCase();
  if (l.includes('up'))   return 'upward';
  if (l.includes('down')) return 'downward';
  return 'sideways';
}
function riskClass(v = '') {
  const l = v.toLowerCase();
  if (l.includes('low'))  return 'low';
  if (l.includes('high')) return 'high';
  return 'medium';
}
function actionClass(v = '') {
  const l = v.toLowerCase();
  if (l.includes('long')) return 'invest';
  if (l.includes('avoid')) return 'avoid';
  return 'watch';
}

export default function AnalysisPanel({ ticker }) {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStock(ticker);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analysis-section">
      <div className="analysis-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="ai-badge">🤖 HuggingFace AI</span>
            {result && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{result.llmUsed}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>
            AI Investment Analysis
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Based on 6 months of historical price data
          </div>
        </div>
        <button
          id={`run-analysis-${ticker}`}
          className="run-analysis-btn"
          onClick={run}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing…</>
            : <>{result ? '🔄 Re-run' : '🚀 Run Analysis'}</>
          }
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: '12px 16px',
          fontSize: '0.82rem',
          color: 'var(--accent-red)',
          marginBottom: 16,
        }}>
          ⚠ {error}
        </div>
      )}

      {!result && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '36px 20px',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧠</div>
          Click <strong style={{ color: 'var(--accent-blue-light)' }}>Run Analysis</strong> to get AI-powered
          investment insights for {ticker} using a HuggingFace LLM.
        </div>
      )}

      {result && (
        <div className="fade-in">
          {/* Result cards */}
          <div className="analysis-results">
            <div className="result-card">
              <div className="result-label">📈 Trend</div>
              <div className={`result-value ${trendClass(result.analysis?.trend)}`}>
                {result.analysis?.trend || '--'}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">⚡ Risk Level</div>
              <div className={`result-value ${riskClass(result.analysis?.riskLevel)}`}>
                {result.analysis?.riskLevel || '--'}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">💡 Suggested Action</div>
              <div className={`result-value ${actionClass(result.analysis?.suggestedAction)}`} style={{ fontSize: '0.9rem' }}>
                {result.analysis?.suggestedAction || '--'}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">📊 Data Points</div>
              <div className="result-value" style={{ color: 'var(--accent-cyan)' }}>
                {result.dataPoints || '--'}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="reason-box">
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Analysis Summary</strong>
            {result.analysis?.reason || 'No summary available.'}
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>{result.disclaimer}</span>
          </div>

          <div className="llm-tag">
            Model: {result.llmUsed} · Analyzed at {new Date(result.analyzedAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
