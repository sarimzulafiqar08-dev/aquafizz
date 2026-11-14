import { categories, products as seedProducts } from '../lib/catalog'
import { STORAGE_KEYS } from '../lib/constants'
import { createId, readJson, slugify, wait, writeJson } from '../lib/storage'
import { PRODUCT_IMAGES_BUCKET, supabase, unwrap } from './supabaseClient'

/**
 * Products data layer. Uses Supabase when configured (see supabaseClient.js),
 * otherwise a browser-storage table seeded from lib/catalog.js.
 */
const listeners = new Set()
let cache = null

const seedImages = (p) => (p.images?.length ? p.images : p.image ? [p.image] : [])

function normalize(p) {
  const images = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : []
  const category = categories.find((c) => c.slug === p.categorySlug) || categories[0]
  return {
    ...p,
    images,
    image: images[0] || '',
    category: category.name,
    categorySlug: category.slug,
    price: Number(p.price) || 0,
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    featured: Boolean(p.featured),
    createdAt: p.createdAt || new Date(0).toISOString(),
  }
}

function emit(rows) {
  cache = rows
  listeners.forEach((fn) => fn(rows))
}

export function subscribeProducts(fn) {
  listeners.add(fn)
  const onStorage = (e) => {
    if (!supabase && e.key === STORAGE_KEYS.products) fn(readTable())
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

/* ───────────── Browser-storage backend ───────────── */

// Bump when catalog.js seed data changes so existing browsers pick it up.
const SEED_VERSION = 2

// Earlier seeds used generic stock photos; those get replaced by the real packshots.
const isPlaceholderImage = (src) => /images\.unsplash\.com/.test(src)

function migrateSeed(stored) {
  const byId = new Map(stored.map((p) => [p.id, p]))
  const migrated = stored.map((p) => {
    const seed = seedProducts.find((s) => s.id === p.id)
    const images = seed ? seedImages(seed) : []
    if (!images.length || !(p.images || [p.image]).every(isPlaceholderImage)) return p
    return { ...p, images, image: images[0] }
  })
  const added = seedProducts.filter((s) => !byId.has(s.id))
  return [...migrated, ...added]
}

function readTable() {
  const stored = readJson(STORAGE_KEYS.products, null)
  if (Array.isArray(stored)) {
    if (readJson(STORAGE_KEYS.productsSeed, 1) >= SEED_VERSION) return stored.map(normalize)
    const migrated = migrateSeed(stored).map(normalize)
    writeJson(STORAGE_KEYS.products, migrated)
    writeJson(STORAGE_KEYS.productsSeed, SEED_VERSION)
    return migrated
  }
  const seeded = seedProducts.map(normalize)
  writeJson(STORAGE_KEYS.products, seeded)
  writeJson(STORAGE_KEYS.productsSeed, SEED_VERSION)
  return seeded
}

function writeTable(rows) {
  writeJson(STORAGE_KEYS.products, rows)
  emit(rows)
}

/* ───────────── Supabase backend ───────────── */

const fromRow = (r) =>
  normalize({
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    size: r.size,
    description: r.description,
    price: r.price,
    stock: r.stock,
    images: r.images,
    categorySlug: r.category,
    featured: r.featured,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })

async function fetchRemote() {
  const rows = unwrap(await supabase.from('products').select('*').order('created_at', { ascending: false }))
  return rows.map(fromRow)
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob()
}

/** Uploads any data: URLs (from the admin form) to Storage and returns public URLs. */
async function uploadPendingImages(images) {
  return Promise.all(
    images.map(async (src) => {
      if (!src.startsWith('data:')) return src
      const path = `${crypto.randomUUID()}.jpg`
      unwrap(
        await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, await dataUrlToBlob(src), { contentType: 'image/jpeg', cacheControl: '31536000' }),
      )
      return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl
    }),
  )
}

async function refreshRemote() {
  emit(await fetchRemote())
}

/* ───────────── Public API ───────────── */

export async function listProducts() {
  if (supabase) {
    const rows = await fetchRemote()
    cache = rows
    return rows
  }
  await wait()
  return readTable()
}

export async function getProductBySlug(slug) {
  if (supabase) {
    const row = unwrap(await supabase.from('products').select('*').eq('slug', slug).maybeSingle())
    return row ? fromRow(row) : null
  }
  await wait()
  return readTable().find((p) => p.slug === slug) || null
}

export async function listCategories() {
  if (!supabase) await wait()
  return categories
}

function validate(input) {
  const name = String(input.name || '').trim()
  if (!name) throw new Error('Product name is required.')
  const price = Number(input.price)
  if (!Number.isFinite(price) || price <= 0) throw new Error('Price must be greater than 0.')
  const stock = Number(input.stock)
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a whole number (0 or more).')
  if (!categories.some((c) => c.slug === input.categorySlug)) throw new Error('Choose a category.')
  return { name, price, stock }
}

function uniqueSlug(rows, name, ignoreId) {
  const base = slugify(name) || 'product'
  let slug = base
  let n = 2
  while (rows.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base}-${n++}`
  return slug
}

const toRow = (input, { name, price, stock }, images) => ({
  name,
  brand: String(input.brand || '').trim() || 'AquaFizz',
  size: String(input.size || '').trim(),
  description: String(input.description || '').trim(),
  category: input.categorySlug,
  price,
  stock,
  featured: Boolean(input.featured),
  images,
})

export async function createProduct(input) {
  const valid = validate(input)
  if (supabase) {
    const existing = cache || (await fetchRemote())
    const images = await uploadPendingImages(input.images || [])
    const row = unwrap(
      await supabase
        .from('products')
        .insert({ ...toRow(input, valid, images), slug: uniqueSlug(existing, valid.name) })
        .select()
        .single(),
    )
    await refreshRemote()
    return fromRow(row)
  }
  await wait(200)
  const rows = readTable()
  const product = normalize({
    id: createId('p_'),
    slug: uniqueSlug(rows, valid.name),
    ...toRow(input, valid, input.images || []),
    categorySlug: input.categorySlug,
    createdAt: new Date().toISOString(),
  })
  writeTable([product, ...rows])
  return product
}

export async function updateProduct(id, input) {
  const valid = validate(input)
  if (supabase) {
    const images = await uploadPendingImages(input.images || [])
    const row = unwrap(
      await supabase
        .from('products')
        .update({ ...toRow(input, valid, images), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle(),
    )
    if (!row) throw new Error('This product no longer exists, or you are not allowed to edit it.')
    await refreshRemote()
    return fromRow(row)
  }
  await wait(200)
  const rows = readTable()
  const current = rows.find((p) => p.id === id)
  if (!current) throw new Error('This product no longer exists.')
  const next = normalize({
    ...current,
    ...toRow(input, valid, input.images || []),
    brand: String(input.brand || '').trim() || current.brand,
    categorySlug: input.categorySlug,
    updatedAt: new Date().toISOString(),
  })
  writeTable(rows.map((p) => (p.id === id ? next : p)))
  return next
}

export async function deleteProduct(id) {
  if (supabase) {
    const removed = unwrap(await supabase.from('products').delete().eq('id', id).select('id'))
    if (!removed.length) throw new Error('This product no longer exists, or you are not allowed to delete it.')
    await refreshRemote()
    return
  }
  await wait(200)
  const rows = readTable()
  if (!rows.some((p) => p.id === id)) throw new Error('This product no longer exists.')
  writeTable(rows.filter((p) => p.id !== id))
}

/** Local backend only: checks cart lines against stock and reserves it. With Supabase, place_order() does this. */
export function reserveStock(lines) {
  const rows = readTable()
  for (const line of lines) {
    const product = rows.find((p) => p.id === line.id)
    if (!product) throw new Error(`${line.name} is no longer available. Remove it from your cart.`)
    if (product.stock < line.quantity) {
      throw new Error(
        product.stock === 0
          ? `${product.name} is out of stock.`
          : `Only ${product.stock} × ${product.name} left. Update your cart.`,
      )
    }
  }
  writeTable(
    rows.map((p) => {
      const line = lines.find((l) => l.id === p.id)
      return line ? { ...p, stock: p.stock - line.quantity } : p
    }),
  )
}

/** Puts stock back for a cancelled order (demo mode; Supabase does this in a trigger). */
export function releaseStock(lines) {
  const rows = readTable()
  writeTable(
    rows.map((p) => {
      const qty = lines.filter((l) => l.id === p.id).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)
      return qty ? { ...p, stock: p.stock + qty } : p
    }),
  )
  emit(readTable())
}

/** Re-reads products after an order changed stock. */
export async function refreshProducts() {
  if (supabase) await refreshRemote()
  else emit(readTable())
}

export function getRelatedProducts(products, product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .concat(products.filter((p) => p.id !== product.id))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, limit)
}

export function filterProducts(list, filters) {
  return list.filter((p) => {
    if (filters.query) {
      const q = filters.query.toLowerCase()
      const hay = `${p.name} ${p.brand} ${p.category} ${p.size}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.category && p.categorySlug !== filters.category) return false
    if (filters.brand && String(p.brand || '').trim().toLowerCase() !== filters.brand.trim().toLowerCase()) return false
    if (filters.size && p.size !== filters.size) return false
    if (filters.availability === 'in' && p.stock <= 0) return false
    if (filters.availability === 'out' && p.stock > 0) return false
    if (filters.deals && p.categorySlug !== 'deal-boxes') return false
    if (filters.minPrice != null && p.price < Number(filters.minPrice)) return false
    if (filters.maxPrice != null && p.price > Number(filters.maxPrice)) return false
    return true
  })
}

export function sortProducts(list, sort) {
  const copy = [...list]
  if (sort === 'price-asc') copy.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') copy.sort((a, b) => b.price - a.price)
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'featured') copy.sort((a, b) => Number(b.featured) - Number(a.featured))
  if (sort === 'newest') copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return copy
}
