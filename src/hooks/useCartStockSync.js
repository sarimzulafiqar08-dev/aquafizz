import { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useProducts } from './useProducts'

/** Keeps cart quantities, stock and prices in line with the latest products. */
export function useCartStockSync() {
  const { syncWithProducts } = useCart()
  const { products } = useProducts()
  useEffect(() => {
    syncWithProducts(products)
  }, [products, syncWithProducts])
}
