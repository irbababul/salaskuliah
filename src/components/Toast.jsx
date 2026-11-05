import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

let _id = 0

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onRemove])

  const icons = {
    success: <FiCheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />,
    error:   <FiAlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />,
    warning: <FiAlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />,
    info:    <FiInfo size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />,
  }

  return (
    <div className={`toast toast-${toast.type}`}>
      {icons[toast.type] || icons.info}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, display: 'flex' }}>
        <FiX size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    setToasts(prev => [...prev, { id: ++_id, message, type, duration }])
  }, [])

  show.success = (m, d) => show(m, 'success', d)
  show.error   = (m, d) => show(m, 'error', d)
  show.warning = (m, d) => show(m, 'warning', d)
  show.info    = (m, d) => show(m, 'info', d)

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
      </div>
    </ToastContext.Provider>
  )
}
