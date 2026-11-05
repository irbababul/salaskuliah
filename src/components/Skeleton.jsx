export function SkeletonBox({ width = '100%', height = 16, className = '', style = {} }) {
  return (
    <div className={`skeleton ${className}`} style={{ width, height, ...style }} />
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rt-card p-4 space-y-3">
      <SkeletonBox height={18} width="70%" />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBox key={i} height={12} width={i === lines - 1 ? '50%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="rt-card p-4">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <SkeletonBox width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonBox height={22} width="55%" style={{ marginBottom: 8 }} />
          <SkeletonBox height={11} width="75%" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="page-enter space-y-5">
      <div>
        <SkeletonBox height={28} width="220px" style={{ marginBottom: 8 }} />
        <SkeletonBox height={14} width="160px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {[1,2,3,4,5].map(i => <SkeletonStatCard key={i} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <SkeletonCard lines={5} />
    </div>
  )
}
