import { useMemo, useEffect } from 'react'
import { useReading } from '../../reading/ReadingContext'
import { ACHIEVEMENTS_DEF } from '../../reading/constants'
import ProgressBar from '../../reading/components/ProgressBar'
import { useAuth } from '../../contexts/AuthContext'

function getProgress(ach, stats) {
  switch (ach.id) {
    case 'first_book':   return { value: Math.min(stats.doneBooks, 1),             max: 1 }
    case 'milestone_10': return { value: Math.min(stats.doneBooks, 10),            max: 10 }
    case 'milestone_20': return { value: Math.min(stats.doneBooks, 20),            max: 20 }
    case 'milestone_40': return { value: Math.min(stats.doneBooks, 40),            max: 40 }
    case 'milestone_60': return { value: Math.min(stats.doneBooks, 60),            max: 60 }
    case 'milestone_80': return { value: Math.min(stats.doneBooks, 80),            max: 80 }
    case 'streak_7':     return { value: Math.min(stats.currentStreak, 7),         max: 7 }
    case 'streak_30':    return { value: Math.min(stats.currentStreak, 30),        max: 30 }
    case 'monthly_goal': return { value: Math.min(stats.monthlyGoalMet, 1),        max: 1 }
    case 'pages_1000':   return { value: Math.min(stats.totalPages, 1000),         max: 1000 }
    case 'pages_5000':   return { value: Math.min(stats.totalPages, 5000),         max: 5000 }
    default: return null
  }
}

function AchCard({ ach, unlocked, stats }) {
  const prog = getProgress(ach, stats)
  const pct = prog ? Math.round((prog.value / prog.max) * 100) : 0
  return (
    <div style={{
      padding: '20px 16px', borderRadius: 14, textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      border: `1px solid ${unlocked ? 'rgba(52,211,153,0.35)' : 'var(--border)'}`,
      opacity: unlocked ? 1 : 0.65,
      transition: 'all 0.2s',
    }}>
      {/* Icon */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
          backgroundColor: unlocked ? 'var(--success-dim)' : 'var(--bg-hover)',
          filter: unlocked ? 'none' : 'grayscale(70%)',
        }}>
          {ach.icon}
        </div>
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 20, height: 20, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
          backgroundColor: unlocked ? 'var(--success)' : 'var(--bg-hover)',
          color: unlocked ? '#fff' : 'var(--text-muted)',
          border: '2px solid var(--bg-card)',
        }}>
          {unlocked ? '✓' : '🔒'}
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 5 }}>
        {ach.title}
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 10 }}>
        {ach.description}
      </p>

      {prog && !unlocked && (
        <div>
          <ProgressBar value={prog.value} max={prog.max} height={4} showLabel={false}
            color={pct >= 70 ? 'var(--warning)' : 'var(--accent)'} />
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>
            {prog.value} / {prog.max} ({pct}%)
          </p>
        </div>
      )}
      {unlocked && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--success)' }}>🎉 Terbuka!</p>
      )}
    </div>
  )
}

function MilestoneTimeline({ doneBooks }) {
  const milestones = [10, 20, 40, 60, 80]
  return (
    <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>Milestone Buku</h3>
      <div style={{ position: 'relative', paddingTop: 8 }}>
        {/* Base track */}
        <div style={{ position: 'absolute', top: 20, left: '5%', right: '5%', height: 3, borderRadius: 99, backgroundColor: 'var(--bg-hover)' }} />
        {/* Progress fill */}
        <div style={{ position: 'absolute', top: 20, left: '5%', height: 3, borderRadius: 99, backgroundColor: 'var(--accent)', width: `${Math.min(90, (doneBooks / 80) * 90)}%`, transition: 'width 0.8s ease' }} />
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'space-around', position: 'relative' }}>
          {milestones.map(m => {
            const reached = doneBooks >= m
            return (
              <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, border: `2px solid ${reached ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: reached ? 'var(--accent)' : 'var(--bg-card)',
                  color: reached ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s', zIndex: 1,
                }}>
                  {reached ? '✓' : m}
                </div>
                <span style={{ fontSize: 12, color: reached ? 'var(--accent)' : 'var(--text-muted)', fontWeight: reached ? 600 : 400 }}>
                  {m} buku
                </span>
              </div>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Posisi kamu: <strong style={{ color: 'var(--text-primary)' }}>{doneBooks} buku</strong>
          {doneBooks < 80 && (
            <span> · Selanjutnya: <strong style={{ color: 'var(--accent)' }}>{milestones.find(m => m > doneBooks) || 80}</strong> ({(milestones.find(m => m > doneBooks) || 80) - doneBooks} lagi)</span>
          )}
        </div>
      </div>
    </div>
  )
}

function StreakDisplay({ streak, readDays }) {
  const today = new Date()
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13 - i))
    return { key: d.toISOString().slice(0, 10), label: d.getDate(), read: readDays.includes(d.toISOString().slice(0, 10)) }
  })
  return (
    <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Streak Membaca</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: streak > 0 ? 'var(--danger)' : 'var(--text-muted)', letterSpacing: '-0.03em', lineHeight: 1 }}>{streak}</span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>hari 🔥</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {last14.map(d => (
          <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ width: '100%', maxWidth: 28, height: 28, borderRadius: 7, backgroundColor: d.read ? 'var(--danger)' : 'var(--bg-hover)', transition: 'background-color 0.2s' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: 13, backgroundColor: streak >= 7 ? 'var(--danger-dim)' : 'var(--bg-hover)', color: streak >= 7 ? 'var(--danger)' : 'var(--text-muted)' }}>
        {streak === 0 && 'Mulai membaca hari ini untuk memulai streak! 💪'}
        {streak >= 1 && streak < 7 && `Terus! ${7 - streak} hari lagi untuk unlock badge streak. 🔥`}
        {streak >= 7 && streak < 30 && `Keren! ${30 - streak} hari lagi streak 30 hari. ⚡`}
        {streak >= 30 && '🏆 Streak 30 hari! Konsistensi luar biasa!'}
      </div>
    </div>
  )
}

export default function ReadingAchievements() {
  const { books, sessions, goals, unlockedAchievements, checkAndUnlockAchievements, computeStats } = useReading()
  const { isAdmin } = useAuth()
  const stats = useMemo(() => computeStats(), [computeStats])

  useEffect(() => { checkAndUnlockAchievements(stats) }, [stats.doneBooks, stats.currentStreak, stats.totalPages, stats.monthlyGoalMet])

  const total = ACHIEVEMENTS_DEF.length
  const unlocked = unlockedAchievements.length
  const sorted = [...ACHIEVEMENTS_DEF].sort((a, b) => {
    const au = unlockedAchievements.includes(a.id), bu = unlockedAchievements.includes(b.id)
    return au && !bu ? -1 : !au && bu ? 1 : 0
  })

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>Achievements</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{unlocked} / {total} pencapaian terbuka</p>
        </div>
        {/* Circular progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>{unlocked}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>dari {total} badge</p>
          </div>
          <svg width={56} height={56} viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-hover)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" strokeWidth="3"
              strokeDasharray={`${(unlocked / total) * 100} 100`} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Overall progress */}
      <div style={{ padding: '14px 18px', borderRadius: 12, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <ProgressBar value={unlocked} max={total} height={8} color="var(--warning)" />
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 7 }}>{Math.round((unlocked / total) * 100)}% pencapaian terbuka</p>
      </div>

      {/* Milestone + streak */}
      <MilestoneTimeline doneBooks={stats.doneBooks} />
      <StreakDisplay streak={stats.currentStreak} readDays={stats.readDays} />

      {/* Achievement grid */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>SEMUA PENCAPAIAN</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map(ach => (
            <AchCard key={ach.id} ach={ach} unlocked={unlockedAchievements.includes(ach.id)} stats={stats} />
          ))}
        </div>
      </div>

      {/* Next hints */}
      {unlocked < total && (
        <div style={{ padding: '20px 22px', borderRadius: 16, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Yang Perlu Dilakukan Selanjutnya</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACHIEVEMENTS_DEF.filter(a => !unlockedAchievements.includes(a.id)).slice(0, 3).map(ach => {
              const p = getProgress(ach, stats) || { value: 0, max: 1 }
              return (
                <div key={ach.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-hover)' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{ach.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ach.title}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{p.value}/{p.max}</span>
                    </div>
                    <ProgressBar value={p.value} max={p.max} height={4} showLabel={false}
                      color={Math.round((p.value / p.max) * 100) >= 70 ? 'var(--warning)' : 'var(--accent)'} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
