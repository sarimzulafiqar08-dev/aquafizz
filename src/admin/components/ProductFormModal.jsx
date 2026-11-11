import { ImagePlus, Link2, Star, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Field, inputClass } from '../../components/Field'
import { FormError, Spinner } from '../../components/Feedback'
import { categories } from '../../lib/catalog'
import { MAX_PRODUCT_IMAGES } from '../../lib/constants'
import { fileToCompressedDataUrl } from '../../lib/images'

const emptyProduct = {
  name: '',
  brand: '',
  size: '',
  categorySlug: categories[0].slug,
  price: '',
  stock: '',
  description: '',
  featured: false,
  images: [],
}

export function ProductFormModal({ product, onClose, onSubmit }) {
  const [form, setForm] = useState(() =>
    product
      ? { ...emptyProduct, ...product, price: String(product.price), stock: String(product.stock) }
      : emptyProduct,
  )
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const fileInput = useRef(null)
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [busy, onClose])

  const remaining = MAX_PRODUCT_IMAGES - form.images.length

  const addFiles = async (fileList) => {
    const files = [...fileList].slice(0, remaining)
    if (!files.length) return
    setUploading(true)
    setError('')
    const results = await Promise.allSettled(files.map((f) => fileToCompressedDataUrl(f)))
    const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason.message)
    setForm((f) => ({ ...f, images: [...f.images, ...ok].slice(0, MAX_PRODUCT_IMAGES) }))
    if (failed.length) setError(failed.join(' '))
    if (fileList.length > remaining) setError(`Only ${MAX_PRODUCT_IMAGES} images allowed per product.`)
    setUploading(false)
  }

  const addUrl = () => {
    const url = urlDraft.trim()
    if (!/^https?:\/\//i.test(url)) {
      setError('Image URL must start with http:// or https://')
      return
    }
    if (remaining <= 0) return
    setForm((f) => ({ ...f, images: [...f.images, url] }))
    setUrlDraft('')
    setError('')
  }

  const removeImage = (index) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  const makePrimary = (index) =>
    setForm((f) => ({ ...f, images: [f.images[index], ...f.images.filter((_, i) => i !== index)] }))

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 md:items-center md:p-4" onClick={() => !busy && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            await onSubmit({ ...form, price: Number(form.price), stock: Number(form.stock) })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="product-form-title" className="text-lg font-semibold">
            {product ? 'Edit product' : 'Add product'}
          </h2>
          <button type="button" aria-label="Close" disabled={busy} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto px-6 py-5">
          <FormError message={error} />

          <div>
            <p className="text-sm font-medium text-slate-800">
              Images <span className="font-normal text-slate-500">({form.images.length}/{MAX_PRODUCT_IMAGES}, first is the cover)</span>
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {form.images.map((src, i) => (
                <div key={`${i}-${src.slice(-24)}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-light-aqua">
                  <img src={src} alt={`Product image ${i + 1}`} className="h-full w-full bg-white object-contain p-1" />
                  {i === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">Cover</span>
                  ) : (
                    <button
                      type="button"
                      aria-label="Make cover image"
                      title="Make cover"
                      className="absolute bottom-1.5 left-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm"
                      onClick={() => makePrimary(i)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow-sm"
                    onClick={() => removeImage(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {remaining > 0 ? (
                <button
                  type="button"
                  disabled={uploading}
                  className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary-dark"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    addFiles(e.dataTransfer.files)
                  }}
                >
                  {uploading ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs font-medium">
                      <ImagePlus className="h-5 w-5" />
                      Upload
                    </span>
                  )}
                </button>
              ) : null}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {remaining > 0 ? (
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    aria-label="Image URL"
                    placeholder="…or paste an image URL"
                    className={`${inputClass} pl-9`}
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addUrl()
                      }
                    }}
                  />
                </div>
                <button type="button" className="rounded-full border border-slate-200 px-4 text-sm font-medium" onClick={addUrl}>
                  Add
                </button>
              </div>
            ) : null}
          </div>

          <Field id="p-name" label="Name">
            <input id="p-name" required className={inputClass} value={form.name} onChange={set('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="p-brand" label="Brand">
              <input id="p-brand" className={inputClass} value={form.brand} onChange={set('brand')} />
            </Field>
            <Field id="p-size" label="Size">
              <input id="p-size" placeholder="500ml" className={inputClass} value={form.size} onChange={set('size')} />
            </Field>
            <Field id="p-category" label="Category">
              <select id="p-category" className={inputClass} value={form.categorySlug} onChange={set('categorySlug')}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field id="p-price" label="Price (Rs)">
              <input id="p-price" type="number" min="1" step="1" required className={inputClass} value={form.price} onChange={set('price')} />
            </Field>
            <Field id="p-stock" label="Stock">
              <input id="p-stock" type="number" min="0" step="1" required className={inputClass} value={form.stock} onChange={set('stock')} />
            </Field>
          </div>
          <Field id="p-description" label="Description">
            <textarea id="p-description" rows={3} className={inputClass} value={form.description} onChange={set('description')} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} />
            Show in “Featured drinks” on the home page
          </label>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={busy} className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            {product ? 'Save changes' : 'Create product'}
          </button>
        </footer>
      </form>
    </div>
  )
}
