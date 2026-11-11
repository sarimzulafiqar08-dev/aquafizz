import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Please confirm',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        resolve,
      })
    })
  }, [])

  const close = (result) => {
    dialog?.resolve(result)
    setDialog(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2 id="confirm-title" className="text-lg font-semibold">
              {dialog.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{dialog.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => close(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                onClick={() => close(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
