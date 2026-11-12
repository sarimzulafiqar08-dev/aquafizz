import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DELIVERY_FEE, FREE_DELIVERY_MIN, PROMO_CODES, STORAGE_KEYS } from '../lib/constants'
import { readJson, writeJson } from '../lib/storage'

const CartContext = createContext(null)

/** Most of one product a customer can order at once. */
export const MAX_PER_ITEM = 20

/** Highest quantity allowed for a product with this stock (unknown stock → MAX_PER_ITEM). */
export function maxFor(stock) {
  return typeof stock === 'number' ? Math.max(0, Math.min(MAX_PER_ITEM, stock)) : MAX_PER_ITEM
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readJson(STORAGE_KEYS.cart, []))
  const [promo, setPromo] = useState('')

  useEffect(() => {
    writeJson(STORAGE_KEYS.cart, items)
  }, [items])

  /**
   * Adds up to `quantity`, never more than the product's stock (or MAX_PER_ITEM).
   * Returns how many were actually added (0 when the limit is already reached).
   */
  const addItem = useCallback(
    (product, quantity = 1) => {
      const limit = maxFor(product.stock)
      const existing = items.find((i) => i.id === product.id)
      const added = Math.max(0, Math.min(quantity, limit - (existing?.quantity || 0)))
      if (!added) return 0
      setItems((current) => {
        const prev = current.find((i) => i.id === product.id)
        if (prev) {
          return current.map((i) =>
            i.id === product.id
              ? { ...i, stock: product.stock, price: product.price, quantity: Math.min(limit, i.quantity + added) }
              : i,
          )
        }
        return [
          ...current,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            size: product.size,
            price: product.price,
            image: product.image,
            stock: product.stock,
            quantity: Math.min(limit, added),
          },
        ]
      })
      return added
    },
    [items],
  )

  const setQuantity = useCallback((id, quantity) => {
    setItems((current) =>
      current
        .map((i) => (i.id === id ? { ...i, quantity: Math.min(maxFor(i.stock), Math.max(0, quantity)) } : i))
        .filter((i) => i.quantity > 0),
    )
  }, [])

  /** Refreshes stock and price from the latest products; lowers quantities above stock. */
  const syncWithProducts = useCallback((products) => {
    if (!products?.length) return
    setItems((current) => {
      let changed = false
      const next = current.map((i) => {
        const p = products.find((x) => x.id === i.id)
        if (!p) return i
        const quantity = p.stock > 0 ? Math.min(i.quantity, maxFor(p.stock)) : i.quantity
        if (p.stock === i.stock && p.price === i.price && quantity === i.quantity) return i
        changed = true
        return { ...i, stock: p.stock, price: p.price, quantity }
      })
      return changed ? next : current
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const code = promo.trim().toUpperCase()
    const promoRule = PROMO_CODES[code]
    const discount = promoRule?.type === 'percent' ? Math.round(subtotal * (promoRule.value / 100)) : 0
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE
    return {
      // Items that can't be ordered as they are (sold out, or more than is left).
      unavailable: items.filter((i) => typeof i.stock === 'number' && i.quantity > i.stock),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      discount,
      delivery,
      total: Math.max(0, subtotal + delivery - discount),
      promoValid: Boolean(promoRule),
      promoCode: promoRule ? code : '',
    }
  }, [items, promo])

  const value = useMemo(
    () => ({
      items,
      promo,
      setPromo,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      syncWithProducts,
      summary,
    }),
    [items, promo, addItem, setQuantity, removeItem, clearCart, syncWithProducts, summary],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
