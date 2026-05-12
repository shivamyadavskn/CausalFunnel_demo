export default function StatCard({ label, value, icon, iconBg, meta }) {
  return (
    <div className="stat-card animate-fadeInUp">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className="stat-card-value">
        {value === undefined || value === null ? '—' : value.toLocaleString()}
      </div>
      {meta && <div className="stat-card-meta">{meta}</div>}
    </div>
  );
}
