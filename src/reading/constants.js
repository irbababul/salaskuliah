// Default goals
export const DEFAULT_GOALS = {
  yearlyTarget: 80,
  dailyPages: 52,
  weeklyBooks: 1,
  monthlyBooks: 7,
  startDate: '2026-11-01',
  endDate: '2027-10-31',
}

// Book statuses
export const BOOK_STATUS = {
  UNREAD: 'Belum Dibaca',
  READING: 'Sedang Dibaca',
  DONE: 'Selesai',
  PAUSED: 'Ditunda',
}

export const STATUS_COLOR = {
  'Belum Dibaca': '#64748b',
  'Sedang Dibaca': '#3b82f6',
  'Selesai': '#22c55e',
  'Ditunda': '#f59e0b',
}

export const STATUS_EMOJI = {
  'Belum Dibaca': '📚',
  'Sedang Dibaca': '📖',
  'Selesai': '✅',
  'Ditunda': '⏸️',
}

// Default book categories
export const DEFAULT_CATEGORIES = [
  'Filsafat',
  'Psikologi',
  'Logika dan Retorika',
  'Matematika',
  'Data Science',
  'Ekonomi',
  'Politik',
  'Sejarah',
  'Sosiologi',
  'Kepemimpinan',
  'Sains dan Teknologi',
  'Sastra',
  'Pengembangan Diri',
]

// Achievements definition
export const ACHIEVEMENTS_DEF = [
  {
    id: 'first_book',
    title: 'Buku Pertama',
    description: 'Selesaikan buku pertamamu',
    icon: '📖',
    condition: (stats) => stats.doneBooks >= 1,
  },
  {
    id: 'milestone_10',
    title: 'Puluhan Buku',
    description: 'Selesaikan 10 buku',
    icon: '🔟',
    condition: (stats) => stats.doneBooks >= 10,
  },
  {
    id: 'milestone_20',
    title: 'Dua Puluh Buku',
    description: 'Selesaikan 20 buku',
    icon: '🎯',
    condition: (stats) => stats.doneBooks >= 20,
  },
  {
    id: 'milestone_40',
    title: 'Empat Puluh Buku',
    description: 'Selesaikan 40 buku — separuh target!',
    icon: '🏅',
    condition: (stats) => stats.doneBooks >= 40,
  },
  {
    id: 'milestone_60',
    title: 'Enam Puluh Buku',
    description: 'Selesaikan 60 buku',
    icon: '🥈',
    condition: (stats) => stats.doneBooks >= 60,
  },
  {
    id: 'milestone_80',
    title: 'Target Tercapai!',
    description: 'Selesaikan 80 buku dalam setahun',
    icon: '🏆',
    condition: (stats) => stats.doneBooks >= 80,
  },
  {
    id: 'streak_7',
    title: 'Streak 7 Hari',
    description: 'Membaca 7 hari berturut-turut',
    icon: '🔥',
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Streak 30 Hari',
    description: 'Membaca 30 hari berturut-turut',
    icon: '⚡',
    condition: (stats) => stats.currentStreak >= 30,
  },
  {
    id: 'monthly_goal',
    title: 'Target Bulanan',
    description: 'Capai target bulanan pertamamu',
    icon: '📅',
    condition: (stats) => stats.monthlyGoalMet >= 1,
  },
  {
    id: 'pages_1000',
    title: '1000 Halaman',
    description: 'Baca total 1000 halaman',
    icon: '📄',
    condition: (stats) => stats.totalPages >= 1000,
  },
  {
    id: 'pages_5000',
    title: '5000 Halaman',
    description: 'Baca total 5000 halaman',
    icon: '📚',
    condition: (stats) => stats.totalPages >= 5000,
  },
]
