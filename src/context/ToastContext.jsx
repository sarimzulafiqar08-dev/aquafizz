import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success') => {
      const id = crypto.randomUUID()
      setToasts((list) => [...list, { id, message, type }])
      window.setTimeout(() => dismiss(id), 2800)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss, toasts }), [push, dismiss, toasts])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-[min(92vw,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-lg ${
              toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-black text-white'
            }`}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
