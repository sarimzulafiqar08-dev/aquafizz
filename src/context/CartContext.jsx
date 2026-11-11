import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DELIVERY_FEE, FREE_DELIVERY_MIN, PROMO_CODES, STORAGE_KEYS } from '../lib/constants'
import { readJson, writeJson } from '../lib/storage'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readJson(STORAGE_KEYS.cart, []))
  const [promo, setPromo] = useState('')

  useEffect(() => {
    writeJson(STORAGE_KEYS.cart, items)
  }, [items])

  const addItem = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.id === product.id)
      if (existing) {
        return current.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
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
          quantity,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((id, quantity) => {
    setItems((current) =>
      current
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))
        .filter((i) => i.quantity > 0),
    )
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
      summary,
    }),
    [items, promo, addItem, setQuantity, removeItem, clearCart, summary],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
