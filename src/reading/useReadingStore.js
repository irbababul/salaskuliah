import { useLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_GOALS, DEFAULT_CATEGORIES, ACHIEVEMENTS_DEF } from './constants'

// ── ID generator ──────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── Hook utama ────────────────────────────────────────────────
export function useReadingStore() {
  const [books, setBooks] = useLocalStorage('rtr_books', [])
  const [sessions, setSessions] = useLocalStorage('rtr_sessions', [])
  const [journals, setJournals] = useLocalStorage('rtr_journals', [])
  const [goals, setGoals] = useLocalStorage('rtr_goals', DEFAULT_GOALS)
  const [categories, setCategories] = useLocalStorage('rtr_categories', DEFAULT_CATEGORIES)
  const [unlockedAchievements, setUnlockedAchievements] = useLocalStorage('rtr_achievements', [])

  // ── BOOKS CRUD ──────────────────────────────────────────────
  const addBook = (book) => {
    const newBook = {
      id: uid(),
      createdAt: new Date().toISOString(),
      status: 'Belum Dibaca',
      rating: null,
      notes: '',
      startDate: null,
      targetDate: null,
      finishedDate: null,
      currentPage: 0,
      ...book,
    }
    setBooks((prev) => [newBook, ...prev])
    return newBook
  }

  const updateBook = (id, patch) => {
    setBooks((prev) => prev.map((b) => {
      if (b.id !== id) return b
      const merged = { ...b, ...patch }
      // Auto-set finishedDate saat status berubah ke Selesai
      if (patch.status === 'Selesai' && !merged.finishedDate) {
        merged.finishedDate = new Date().toISOString().slice(0, 10)
      }
      // Auto-set startDate saat status berubah ke Sedang Dibaca
      if (patch.status === 'Sedang Dibaca' && !merged.startDate) {
        merged.startDate = new Date().toISOString().slice(0, 10)
      }
      return merged
    }))
  }

  const deleteBook = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id))
    // cascade: remove related sessions and journals
    setSessions((prev) => prev.filter((s) => s.bookId !== id))
    setJournals((prev) => prev.filter((j) => j.bookId !== id))
  }

  // ── SESSIONS CRUD ───────────────────────────────────────────
  const addSession = (session) => {
    const newSession = {
      id: uid(),
      createdAt: new Date().toISOString(),
      notes: '',
      ...session,
    }
    setSessions((prev) => [newSession, ...prev])

    // Auto-update book currentPage if applicable
    const book = books.find((b) => b.id === session.bookId)
    if (book && session.endPage > (book.currentPage || 0)) {
      const patch = { currentPage: session.endPage }
      // Auto-mark as done when reaching last page
      if (book.totalPages && session.endPage >= book.totalPages) {
        patch.status = 'Selesai'
        patch.finishedDate = patch.finishedDate || session.date
      } else if (book.status === 'Belum Dibaca') {
        patch.status = 'Sedang Dibaca'
        patch.startDate = patch.startDate || session.date
      }
      updateBook(session.bookId, patch)
    }

    return newSession
  }

  const updateSession = (id, patch) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const deleteSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // ── JOURNALS CRUD ───────────────────────────────────────────
  const addJournal = (journal) => {
    const newJournal = {
      id: uid(),
      createdAt: new Date().toISOString(),
      tags: [],
      mainIdea: '',
      authorArgument: '',
      agreement: '',
      weaknesses: '',
      realApplication: '',
      newQuestions: '',
      quotes: '',
      reflection: '',
      ...journal,
    }
    setJournals((prev) => [newJournal, ...prev])
    return newJournal
  }

  const updateJournal = (id, patch) => {
    setJournals((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }

  const deleteJournal = (id) => {
    setJournals((prev) => prev.filter((j) => j.id !== id))
  }

  // ── GOALS ───────────────────────────────────────────────────
  const updateGoals = (patch) => {
    setGoals((prev) => ({ ...prev, ...patch }))
  }

  // ── CATEGORIES ──────────────────────────────────────────────
  const addCategory = (name) => {
    const trimmed = name.trim()
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed].sort())
    }
  }

  const deleteCategory = (name) => {
    setCategories((prev) => prev.filter((c) => c !== name))
  }

  // ── ACHIEVEMENTS ────────────────────────────────────────────
  const checkAndUnlockAchievements = (stats) => {
    const newlyUnlocked = []
    ACHIEVEMENTS_DEF.forEach((ach) => {
      if (!unlockedAchievements.includes(ach.id) && ach.condition(stats)) {
        newlyUnlocked.push(ach.id)
      }
    })
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements((prev) => [...prev, ...newlyUnlocked])
    }
    return newlyUnlocked
  }

  // ── COMPUTED STATS ──────────────────────────────────────────
  const computeStats = () => {
    const doneBooks = books.filter((b) => b.status === 'Selesai').length
    const readingBooks = books.filter((b) => b.status === 'Sedang Dibaca').length
    const unreadBooks = books.filter((b) => b.status === 'Belum Dibaca').length
    const pausedBooks = books.filter((b) => b.status === 'Ditunda').length

    const totalPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0)
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)

    // Streak calculation
    const readDays = new Set(sessions.map((s) => s.date))
    let currentStreak = 0
    let d = new Date()
    while (true) {
      const key = d.toISOString().slice(0, 10)
      if (readDays.has(key)) {
        currentStreak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    // Monthly data (last 12 months)
    const monthlyBooks = {}
    const monthlyPages = {}
    books.filter((b) => b.status === 'Selesai').forEach((b) => {
      const dateStr = b.finishedDate || new Date().toISOString().slice(0, 10)
      const month = dateStr.slice(0, 7)
      monthlyBooks[month] = (monthlyBooks[month] || 0) + 1
    })
    sessions.forEach((s) => {
      const month = s.date.slice(0, 7)
      monthlyPages[month] = (monthlyPages[month] || 0) + (s.pagesRead || 0)
    })

    // Progress toward annual target
    const yearlyTarget = goals.yearlyTarget || 80
    const progressPct = Math.min(100, Math.round((doneBooks / yearlyTarget) * 100))

    // Days elapsed / remaining
    const start = new Date(goals.startDate || '2026-11-01')
    const end = new Date(goals.endDate || '2027-10-31')
    const now = new Date()
    const totalDays = Math.ceil((end - start) / 86400000)
    const elapsedDays = Math.max(0, Math.ceil((now - start) / 86400000))
    const remainingDays = Math.max(0, Math.ceil((end - now) / 86400000))
    const booksPerMonth = elapsedDays > 0 ? (doneBooks / (elapsedDays / 30)).toFixed(1) : 0
    const pagesPerDay = elapsedDays > 0 ? (totalPages / elapsedDays).toFixed(1) : 0

    // On track?
    const expectedByNow = Math.round((elapsedDays / totalDays) * yearlyTarget)
    const onTrack = doneBooks >= expectedByNow ? 'ahead' : doneBooks >= expectedByNow - 2 ? 'on_track' : 'behind'

    // Monthly goal check (how many months met target)
    const monthlyTarget = goals.monthlyBooks || 7
    const monthlyGoalMet = Object.values(monthlyBooks).filter((v) => v >= monthlyTarget).length

    return {
      doneBooks,
      readingBooks,
      unreadBooks,
      pausedBooks,
      totalBooks: books.length,
      totalPages,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      currentStreak,
      progressPct,
      yearlyTarget,
      remainingBooks: Math.max(0, yearlyTarget - doneBooks),
      booksPerMonth: parseFloat(booksPerMonth),
      pagesPerDay: parseFloat(pagesPerDay),
      monthlyBooks,
      monthlyPages,
      monthlyGoalMet,
      elapsedDays,
      remainingDays,
      totalDays,
      onTrack,
      readDays: [...readDays],
    }
  }

  return {
    // data
    books,
    // setters (untuk sync dari Sheets)
    setBooks,
    setSessions,
    setJournals,
    setGoals,
    sessions,
    journals,
    goals,
    categories,
    unlockedAchievements,
    // books
    addBook,
    updateBook,
    deleteBook,
    // sessions
    addSession,
    updateSession,
    deleteSession,
    // journals
    addJournal,
    updateJournal,
    deleteJournal,
    // goals
    updateGoals,
    // categories
    addCategory,
    deleteCategory,
    // achievements
    checkAndUnlockAchievements,
    // computed
    computeStats,
  }
}
