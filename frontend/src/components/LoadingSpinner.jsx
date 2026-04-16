export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner-ring" />
      <p className="loading-text">{message}</p>
    </div>
  );
}
