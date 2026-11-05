export default function StatCard({ icon, label, value, sub, color = 'var(--accent)', className = '' }) {
  return (
    <div className={`sk-card p-5 ${className}`} style={{ backgroundColor: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem',
          backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 5 }}>{label}</p>
          {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}
