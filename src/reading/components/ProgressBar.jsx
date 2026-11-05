export default function ProgressBar({ value, max = 100, color = 'var(--accent)', height = 8, showLabel = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
          <span>{value} / {max}</span>
          <span style={{ fontWeight: 600, color }}>{pct}%</span>
        </div>
      )}
      <div style={{ borderRadius: 99, overflow: 'hidden', backgroundColor: 'var(--bg-hover)', height }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          backgroundColor: color,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  )
}
