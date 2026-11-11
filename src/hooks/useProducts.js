import { useCallback, useEffect, useState } from 'react'
import { listProducts, subscribeProducts } from '../services/productService'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    return listProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || 'Could not load products.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    return subscribeProducts(setProducts)
  }, [load])

  return { products, loading, error, reload: load }
}
