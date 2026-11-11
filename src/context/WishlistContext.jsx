import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, writeJson } from '../lib/storage'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => readJson(STORAGE_KEYS.wishlist, []))

  useEffect(() => {
    writeJson(STORAGE_KEYS.wishlist, ids)
  }, [ids])

  const toggle = useCallback((id) => {
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))
  }, [])

  const has = useCallback((id) => ids.includes(id), [ids])

  const value = useMemo(() => ({ ids, toggle, has }), [ids, toggle, has])
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
