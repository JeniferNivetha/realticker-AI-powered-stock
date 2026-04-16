export default function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-icon">⚠️</div>
      <div className="error-title">Something went wrong</div>
      <p className="error-msg">
        {message || 'Unable to fetch data. Make sure the backend server is running on port 8000.'}
      </p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
