import { Heart, LayoutDashboard, LogOut, Package } from 'lucide-react'
import { startTransition, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { LazyLocationPicker } from '../components/LazyLocationPicker'
import { FormError, PageHeader, Spinner } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useWishlist } from '../context/WishlistContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { DISTRICTS, PROVINCE } from '../lib/constants'
import { findDistrict } from '../lib/sindh'
import { formatPKR } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { lettersOnly, normalizePhone } from '../lib/validation'
import { isDeliverable, reverseGeocode } from '../services/deliveryService'
import { listMyOrders } from '../services/orderService'

function DetailsForm() {
  const { user, updateProfile } = useAuth()
  const { push } = useToast()
  const [focus, setFocus] = useState(null)
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    area: DISTRICTS.includes(user.area) ? user.area : '',
    location: user.location || null,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key, clean = (v) => v) => (e) => setForm((f) => ({ ...f, [key]: clean(e.target.value) }))

  const pickLocation = async (location) => {
    setForm((f) => ({ ...f, location }))
    if (!form.address.trim()) {
      const guess = await reverseGeocode(location)
      if (guess) setForm((f) => (f.address.trim() ? f : { ...f, address: guess }))
    }
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (form.location && !isDeliverable(form.location)) {
          setError('Your pin is outside Sindh. We only deliver within Sindh.')
          return
        }
        setBusy(true)
        setError('')
        try {
          await updateProfile(form)
          push('Profile updated')
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <h2 className="text-lg font-semibold">Personal details</h2>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="profile-name" label="Full name" hint="Letters and spaces only.">
          <input id="profile-name" required className={inputClass} value={form.name} onChange={set('name', lettersOnly)} />
        </Field>
        <Field id="profile-email" label="Email" hint="Email can't be changed.">
          <input id="profile-email" disabled className={`${inputClass} bg-slate-50 text-slate-500`} value={user.email} />
        </Field>
        <Field id="profile-cnic" label="CNIC" hint="CNIC can't be changed. Contact support if it's wrong.">
          <input id="profile-cnic" disabled className={`${inputClass} bg-slate-50 text-slate-500`} value={user.cnic || 'Not provided'} />
        </Field>
        <Field
          id="profile-phone"
          label="Mobile number"
          hint="11 digits starting with 03."
        >
          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            maxLength={12}
            placeholder="03XXXXXXXXX"
            className={inputClass}
            value={form.phone}
            onChange={set('phone', normalizePhone)}
          />
        </Field>
        <Field id="profile-province" label="Province">
          <input id="profile-province" readOnly className={`${inputClass} bg-slate-50`} value={PROVINCE} />
        </Field>
        <Field id="profile-area" label="District">
          <select
            id="profile-area"
            className={inputClass}
            value={form.area}
            onChange={(e) => {
              setForm((f) => ({ ...f, area: e.target.value }))
              setFocus(findDistrict(e.target.value))
            }}
          >
            <option value="">Select district</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="profile-address" label="Default delivery address">
        <textarea id="profile-address" rows={2} className={inputClass} value={form.address} onChange={set('address')} />
      </Field>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">Pin your address on the map</p>
        <LazyLocationPicker value={form.location} onChange={pickLocation} focus={focus} height="h-64" />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        Save changes
      </button>
    </form>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const { push } = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (form.next !== form.confirm) {
          setError('New passwords do not match.')
          return
        }
        setBusy(true)
        setError('')
        try {
          await changePassword(form.current, form.next)
          setForm({ current: '', next: '', confirm: '' })
          push('Password changed')
        } catch (err) {
          setError(err.message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <h2 className="text-lg font-semibold">Change password</h2>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="pw-current" label="Current">
          <input id="pw-current" type="password" required autoComplete="current-password" className={inputClass} value={form.current} onChange={set('current')} />
        </Field>
        <Field id="pw-next" label="New">
          <input id="pw-next" type="password" required minLength={6} autoComplete="new-password" className={inputClass} value={form.next} onChange={set('next')} />
        </Field>
        <Field id="pw-confirm" label="Confirm new">
          <input id="pw-confirm" type="password" required autoComplete="new-password" className={inputClass} value={form.confirm} onChange={set('confirm')} />
        </Field>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {busy ? <Spinner /> : null}
        Update password
      </button>
    </form>
  )
}

export function ProfilePage() {
  usePageSeo({ title: 'Account | AquaFizz', description: 'Manage your AquaFizz profile.' })
  const { user, isAdmin, logout } = useAuth()
  const { ids } = useWishlist()
  const navigate = useNavigate()
  // navigate() runs as a transition; signing out in the same transition stops RequireUser bouncing to /login first.
  const signOut = () =>
    startTransition(() => {
      navigate('/')
      logout()
    })
  const { data: orders, loading: ordersLoading } = useAsync(() => listMyOrders(user.id), [user.id], [])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={isAdmin ? 'Admin account' : 'My account'}
        title={`Salaam, ${(user.name || user.email.split('@')[0]).split(' ')[0]}`}
        description={`Member since ${new Date(user.createdAt).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}`}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/orders" className="flex items-center gap-3 rounded-3xl bg-light-aqua p-4 font-medium">
          <Package className="h-5 w-5 text-primary-dark" />
          {ordersLoading ? '…' : orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </Link>
        <Link to="/wishlist" className="flex items-center gap-3 rounded-3xl bg-light-aqua p-4 font-medium">
          <Heart className="h-5 w-5 text-primary-dark" />
          {ids.length} saved {ids.length === 1 ? 'item' : 'items'}
        </Link>
        {isAdmin ? (
          <Link to="/admin" className="flex items-center gap-3 rounded-3xl bg-black p-4 font-medium text-white">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Admin dashboard
          </Link>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 rounded-3xl border border-slate-200 p-4 text-left font-medium"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-100 p-6">
            <DetailsForm />
          </section>
          <section className="rounded-3xl border border-slate-100 p-6">
            <PasswordForm />
          </section>
        </div>
        <aside className="h-fit rounded-3xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          {ordersLoading ? (
            <Spinner className="mt-4 h-5 w-5 text-primary" />
          ) : orders.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              No orders yet. <Link to="/products" className="font-medium text-primary-dark">Start shopping</Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {orders.slice(0, 4).map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm hover:bg-slate-50">
                    <span>
                      <span className="block font-medium">{o.id}</span>
                      <span className="text-xs text-slate-500">{o.status}</span>
                    </span>
                    <span className="font-semibold">{formatPKR(o.totals.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {isAdmin ? (
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-black"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
