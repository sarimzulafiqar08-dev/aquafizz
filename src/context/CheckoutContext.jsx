import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, writeJson } from '../lib/storage'

const emptyDraft = {
  name: '',
  phone: '',
  address: '',
  area: '',
  city: 'Sindh',
  instructions: '',
  deliveryWindow: 'asap',
  scheduledAt: '',
  paymentMethod: 'cod',
  location: null,
}

const CheckoutContext = createContext(null)

export function CheckoutProvider({ children }) {
  const [draft, setDraft] = useState(() => ({
    ...emptyDraft,
    ...readJson(STORAGE_KEYS.checkout, {}),
  }))

  const update = useCallback((patch) => {
    setDraft((current) => {
      const next = { ...current, ...patch }
      writeJson(STORAGE_KEYS.checkout, next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    writeJson(STORAGE_KEYS.checkout, emptyDraft)
    setDraft(emptyDraft)
  }, [])

  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset])
  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}
