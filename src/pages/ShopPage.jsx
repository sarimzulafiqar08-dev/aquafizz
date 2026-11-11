import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, PageHeader, ProductSkeleton } from '../components/Feedback'
import { ProductCard } from '../components/ProductCard'
import { usePageSeo } from '../hooks/usePageSeo'
import { categories } from '../lib/catalog'
import { SORT_OPTIONS } from '../lib/constants'
import { filterProducts, listProducts, sortProducts, subscribeProducts } from '../services/productService'

const emptyFilters = {
  query: '',
  category: '',
  brand: '',
  size: '',
  availability: '',
  minPrice: '',
  maxPrice: '',
  deals: false,
  sort: 'featured',
}

function FilterFields({ filters, setFilters, brands, sizes }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }))
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="shop-search" className="text-sm font-medium">
          Search
        </label>
        <input
          id="shop-search"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
          placeholder="Search products"
        />
      </div>
      <div>
        <label htmlFor="shop-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="shop-category"
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="shop-brand" className="text-sm font-medium">
          Brand
        </label>
        <select
          id="shop-brand"
          value={filters.brand}
          onChange={(e) => set('brand', e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="shop-size" className="text-sm font-medium">
          Size
        </label>
        <select
          id="shop-size"
          value={filters.size}
          onChange={(e) => set('size', e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="">All sizes</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="min-price" className="text-sm font-medium">
            Min price
          </label>
          <input
            id="min-price"
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="max-price" className="text-sm font-medium">
            Max price
          </label>
          <input
            id="max-price"
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="availability" className="text-sm font-medium">
          Availability
        </label>
        <select
          id="availability"
          value={filters.availability}
          onChange={(e) => set('availability', e.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
        >
          <option value="">All</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.deals}
          onChange={(e) => set('deals', e.target.checked)}
        />
        Deals only
      </label>
      <button
        type="button"
        className="text-sm font-medium text-slate-500"
        onClick={() => setFilters({ ...emptyFilters })}
      >
        Reset filters
      </button>
    </div>
  )
}

export function ShopPage() {
  usePageSeo({
    title: 'Shop drinks | AquaFizz',
    description: 'Browse cold drinks, mineral water, juices and deal boxes with fast delivery.',
  })
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState([])
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [filters, setFilters] = useState({
    ...emptyFilters,
    query: params.get('q') || '',
    category: params.get('category') || '',
    deals: params.get('deals') === '1',
  })

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      query: params.get('q') || f.query,
      category: params.get('category') || f.category,
      deals: params.get('deals') === '1' ? true : f.deals,
    }))
  }, [params])

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    listProducts()
      .then((data) => {
        if (live) setAll(data)
      })
      .catch((err) => {
        if (live) setError(err.message || 'Could not load products.')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    const unsubscribe = subscribeProducts(setAll)
    return () => {
      live = false
      unsubscribe()
    }
  }, [attempt])

  const brands = useMemo(() => [...new Set(all.map((p) => p.brand))].sort(), [all])
  const sizes = useMemo(() => [...new Set(all.map((p) => p.size).filter(Boolean))], [all])

  const visible = useMemo(() => {
    const filtered = filterProducts(all, {
      ...filters,
      minPrice: filters.minPrice === '' ? null : Number(filters.minPrice),
      maxPrice: filters.maxPrice === '' ? null : Number(filters.maxPrice),
    })
    return sortProducts(filtered, filters.sort)
  }, [all, filters])

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Shop"
        description="Filter by category, brand, size and price. All prices in PKR."
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{visible.length} products</p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm lg:hidden"
            onClick={() => setDrawer(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden rounded-3xl border border-slate-100 p-4 lg:block">
          <FilterFields filters={filters} setFilters={setFilters} brands={brands} sizes={sizes} />
        </aside>
        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState description={error} onRetry={() => setAttempt((n) => n + 1)} />
          ) : visible.length === 0 ? (
            <EmptyState title="No products found" description="Try a different search or filter." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
      {drawer ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setDrawer(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setDrawer(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterFields filters={filters} setFilters={setFilters} brands={brands} sizes={sizes} />
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-primary py-3 font-semibold"
              onClick={() => setDrawer(false)}
            >
              Show results
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
