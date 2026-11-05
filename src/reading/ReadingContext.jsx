import { createContext, useContext } from 'react'
import { useReadingStore } from './useReadingStore'

const ReadingContext = createContext(null)

export function ReadingProvider({ children }) {
  const store = useReadingStore()
  return <ReadingContext.Provider value={store}>{children}</ReadingContext.Provider>
}

export function useReading() {
  const ctx = useContext(ReadingContext)
  if (!ctx) throw new Error('useReading must be used inside ReadingProvider')
  return ctx
}
