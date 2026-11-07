import { createContext, useContext, useEffect, useRef } from 'react'
import { useReadingStore } from './useReadingStore'
import { adminApi } from '../utils/api'

const ReadingContext = createContext(null)

export function ReadingProvider({ children }) {
  const store = useReadingStore()
  const loadedRef = useRef(false)

  // Load dari Sheets saat pertama kali buka (override localStorage jika ada data di Sheets)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    async function sync() {
      try {
        const [bRes, sRes, jRes, gRes] = await Promise.all([
          adminApi.getReadingBooks().catch(()=>({data:[]})),
          adminApi.getReadingSessions().catch(()=>({data:[]})),
          adminApi.getReadingJournals().catch(()=>({data:[]})),
          adminApi.getReadingGoals().catch(()=>({data:{}})),
        ])
        if (bRes.data?.length > 0) store.setBooks(bRes.data)
        if (sRes.data?.length > 0) store.setSessions(sRes.data)
        if (jRes.data?.length > 0) store.setJournals(jRes.data)
        if (gRes.data && Object.keys(gRes.data).length > 0) store.setGoals(gRes.data)
        console.log('[Reading] Synced from Sheets')
      } catch(e) {
        console.warn('[Reading] Sync failed, using localStorage:', e.message)
      }
    }
    sync()
  }, []) // eslint-disable-line

  // Wrap dengan auto-sync ke Sheets
  const wrapped = {
    ...store,

    addBook(book) {
      const nb = store.addBook(book)
      adminApi.createReadingBook(nb||book).catch(e=>console.warn('sync addBook:',e.message))
      return nb
    },
    updateBook(id, patch) {
      store.updateBook(id, patch)
      setTimeout(() => {
        const b = store.books?.find(b=>b.id===id)
        if (b) adminApi.updateReadingBook(id, {...b,...patch}).catch(e=>console.warn('sync updateBook:',e.message))
      }, 1000)
    },
    deleteBook(id) {
      store.deleteBook(id)
      adminApi.deleteReadingBook(id).catch(e=>console.warn('sync deleteBook:',e.message))
    },
    addSession(session) {
      const ns = store.addSession(session)
      adminApi.createReadingSession(ns||session).catch(e=>console.warn('sync addSession:',e.message))
      return ns
    },
    deleteSession(id) {
      store.deleteSession(id)
      adminApi.deleteReadingSession(id).catch(e=>console.warn('sync deleteSession:',e.message))
    },
    addJournal(journal) {
      const nj = store.addJournal(journal)
      adminApi.createReadingJournal(nj||journal).catch(e=>console.warn('sync addJournal:',e.message))
      return nj
    },
    updateJournal(id, patch) {
      store.updateJournal(id, patch)
      adminApi.updateReadingJournal(id, patch).catch(e=>console.warn('sync updateJournal:',e.message))
    },
    deleteJournal(id) {
      store.deleteJournal(id)
      adminApi.deleteReadingJournal(id).catch(e=>console.warn('sync deleteJournal:',e.message))
    },
    updateGoals(goals) {
      store.updateGoals(goals)
      adminApi.saveReadingGoals(goals).catch(e=>console.warn('sync updateGoals:',e.message))
    },
  }

  return <ReadingContext.Provider value={wrapped}>{children}</ReadingContext.Provider>
}

export function useReading() {
  const ctx = useContext(ReadingContext)
  if (!ctx) throw new Error('useReading must be used inside ReadingProvider')
  return ctx
}
