import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { EmptyState, PageHeader } from '../components/Feedback'
import { LazyLocationPicker } from '../components/LazyLocationPicker'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCheckout } from '../context/CheckoutContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { DELIVERY_WINDOWS, DISTRICTS, PROVINCE } from '../lib/constants'
import { findDistrict } from '../lib/sindh'
import { hasLocation, lettersOnly, nameError, normalizePhone, phoneError } from '../lib/validation'
import { isDeliverable, reverseGeocode } from '../services/deliveryService'
import { OrderSummary } from './CartPage'

export function CheckoutPage() {
  usePageSeo({
    title: 'Checkout | AquaFizz',
    description: 'Enter delivery details and choose a time slot for AquaFizz delivery.',
  })
  const { items } = useCart()
  const { draft, update } = useCheckout()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const [focus, setFocus] = useState(null)

  // Prefill empty delivery fields from the signed-in user's profile.
  useEffect(() => {
    if (!user) return
    const patch = {}
    if (!draft.name && user.name) patch.name = user.name
    if (!draft.phone && user.phone) patch.phone = user.phone
    if (!draft.address && user.address) patch.address = user.address
    if (!draft.area && DISTRICTS.includes(user.area)) patch.area = user.area
    if (!hasLocation(draft.location) && user.location) patch.location = user.location
    if (Object.keys(patch).length) update(patch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add products before checkout."
        action={
          <Link to="/products" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
            Start Shopping
          </Link>
        }
      />
    )
  }

  const pickLocation = async (location) => {
    update({ location })
    setError('')
    if (!draft.address.trim()) {
      const guess = await reverseGeocode(location)
      if (guess) update({ address: guess })
    }
  }

  const nextFromDetails = (e) => {
    e.preventDefault()
    const problem =
      nameError(draft.name, 'Name') ||
      phoneError(draft.phone) ||
      (!DISTRICTS.includes(draft.area) ? 'Please choose your district.' : '') ||
      (!draft.address.trim() ? 'Please enter your address.' : '') ||
      (!hasLocation(draft.location) ? 'Please pin your exact location on the map.' : '') ||
      (!isDeliverable(draft.location) ? 'Sorry, this location is outside Sindh. We only deliver within Sindh.' : '')
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    if (draft.city !== PROVINCE) update({ city: PROVINCE })
    setStep(2)
  }

  return (
    <div>
      <PageHeader title="Checkout" description="Three quick steps — delivery, timing, then payment." />
      <ol className="mb-6 flex gap-2 text-xs font-semibold">
        {['Delivery Details', 'Delivery Time', 'Payment'].map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${step === i + 1 ? 'bg-primary' : 'bg-slate-100'}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-3xl border border-slate-100 p-5">
          {step === 1 ? (
            <form noValidate className="grid gap-4" onSubmit={nextFromDetails}>
              <Field id="name" label="Full name" hint="Letters and spaces only.">
                <input
                  id="name"
                  required
                  autoComplete="name"
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => update({ name: lettersOnly(e.target.value) })}
                />
              </Field>
              <Field
                id="phone"
                label="Mobile number"
                hint="11 digits starting with 03."
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={12}
                  placeholder="03XXXXXXXXX"
                  className={inputClass}
                  value={draft.phone}
                  onChange={(e) => update({ phone: normalizePhone(e.target.value) })}
                />
              </Field>
              <Field id="province" label="Province">
                <input id="province" readOnly className={`${inputClass} bg-slate-50`} value={PROVINCE} />
              </Field>
              <Field id="area" label="District">
                <select
                  id="area"
                  required
                  className={inputClass}
                  value={DISTRICTS.includes(draft.area) ? draft.area : ''}
                  onChange={(e) => {
                    update({ area: e.target.value })
                    setFocus(findDistrict(e.target.value))
                    setError('')
                  }}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="address" label="Address">
                <textarea
                  id="address"
                  required
                  rows={3}
                  className={inputClass}
                  value={draft.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              </Field>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Pin your exact location</p>
                <LazyLocationPicker value={draft.location} onChange={pickLocation} focus={focus} />
              </div>
              <Field id="instructions" label="Delivery instructions">
                <textarea
                  id="instructions"
                  rows={2}
                  className={inputClass}
                  value={draft.instructions}
                  onChange={(e) => update({ instructions: e.target.value })}
                />
              </Field>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" className="rounded-full bg-primary py-3 font-semibold">
                Continue
              </button>
            </form>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-3">
              {DELIVERY_WINDOWS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${
                    draft.deliveryWindow === slot.id ? 'border-primary bg-light-aqua' : 'border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="window"
                    checked={draft.deliveryWindow === slot.id}
                    onChange={() => update({ deliveryWindow: slot.id })}
                  />
                  <span>
                    <span className="block font-semibold">{slot.label}</span>
                    <span className="text-sm text-slate-500">{slot.hint}</span>
                  </span>
                </label>
              ))}
              {draft.deliveryWindow === 'schedule' ? (
                <Field id="scheduledAt" label="Preferred time">
                  <input
                    id="scheduledAt"
                    type="datetime-local"
                    className={inputClass}
                    value={draft.scheduledAt}
                    onChange={(e) => update({ scheduledAt: e.target.value })}
                  />
                </Field>
              ) : null}
              <div className="mt-2 flex gap-3">
                <button type="button" className="rounded-full px-4 py-2 text-sm" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold"
                  onClick={() => setStep(3)}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}
          {step === 3 ? (
            <div>
              <p className="text-sm text-slate-600">
                Choose how you’d like to pay on the next screen. Your delivery details are saved on this device until
                checkout is complete.
              </p>
              <div className="mt-4 flex gap-3">
                <button type="button" className="rounded-full px-4 py-2 text-sm" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="button"
                  className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                  onClick={() => navigate('/payment')}
                >
                  Go to payment
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <OrderSummary />
      </div>
    </div>
  )
}
