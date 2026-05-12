import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/sessions', icon: '⬡', label: 'Sessions', desc: 'User journeys' },
  { to: '/heatmap', icon: '◉', label: 'Heatmap', desc: 'Click patterns' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">📡</div>
          <div className="logo-text">
            <span className="logo-name">CausalFunnel</span>
            <span className="logo-tagline">Analytics</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: '16px' }}>Resources</div>
        <a
          href="http://localhost:4000/health"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          <span className="nav-icon">🔗</span>
          API Health
        </a>
        <a
          href="../demo/index.html"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          <span className="nav-icon">🧪</span>
          Demo Page
        </a>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="sidebar-footer-text">
          <span className="status-dot" />
          Tracking Active
        </p>
      </div>
    </aside>
  );
}
