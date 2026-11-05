export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.6, marginBottom: action ? 20 : 0 }}>{description}</p>
      )}
      {action}
    </div>
  )
}
