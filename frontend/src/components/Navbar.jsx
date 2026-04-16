export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="brand-logo">📈</div>
          <div>
            <div className="brand-name">RealTicker</div>
            <div className="brand-sub">AI Stock Intelligence</div>
          </div>
        </div>
        <div className="navbar-right">
          <div className="nav-badge">
            <span className="nav-dot" />
            Live Data
          </div>
          <div className="nav-sorim">SORIM.Ai</div>
        </div>
      </div>
    </nav>
  );
}
