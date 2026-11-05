export default function ReadingStatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
          backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 5 }}>{label}</p>
          {sub && <p style={{ fontSize: '0.75rem', color, marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
    </div>
  )
}
