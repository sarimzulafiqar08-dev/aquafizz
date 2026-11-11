import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../components/Field'
import { FormError, PageHeader, Spinner } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { DISTRICTS, PROVINCE } from '../lib/constants'
import { addressError, cnicError, formatCnic, lettersOnly, nameError, normalizePhone, phoneError } from '../lib/validation'
import { requestPasswordReset, resetPassword, usesSupabaseAuth } from '../services/authService'
import { setNewPassword } from '../services/authSupabase'

function SubmitButton({ busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold disabled:opacity-60"
    >
      {busy ? <Spinner /> : null}
      {children}
    </button>
  )
}

export function LoginPage() {
  usePageSeo({ title: 'Login | AquaFizz', description: 'Sign in to AquaFizz to track orders.' })
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Login" description="Sign in to track orders, save your wishlist and check out faster." />
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError('')
          try {
            const account = await login({ email, password })
            push(`Welcome back, ${(account.name || account.email).split(' ')[0]}`)
            navigate(location.state?.from || '/profile', { replace: true })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <FormError message={error} />
        <Field id="email" label="Email">
          <input id="email" type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="password" label="Password">
          <input id="password" type="password" autoComplete="current-password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Link to="/forgot-password" className="-mt-2 justify-self-end text-sm font-medium text-primary-dark">
          Forgot password?
        </Link>
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link className="font-medium text-primary-dark" to="/signup" state={location.state}>Create an account</Link>
      </p>
    </div>
  )
}

export function SignupPage() {
  usePageSeo({ title: 'Sign up | AquaFizz', description: 'Create your AquaFizz account.' })
  const { register } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cnic: '',
    area: '',
    address: '',
    password: '',
    confirm: '',
  })
  const [touched, setTouched] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')

  const set = (key, clean = (v) => v) => (e) => setForm((f) => ({ ...f, [key]: clean(e.target.value) }))
  const blur = (key) => () => setTouched((t) => ({ ...t, [key]: true }))
  const errors = {
    firstName: nameError(form.firstName, 'First name'),
    lastName: nameError(form.lastName, 'Last name'),
    phone: phoneError(form.phone),
    cnic: cnicError(form.cnic),
    area: DISTRICTS.includes(form.area) ? '' : 'Please choose your district.',
    address: addressError(form.address),
    confirm: form.confirm && form.confirm !== form.password ? 'Passwords do not match.' : '',
  }
  const show = (key) => (touched[key] ? errors[key] : '')

  if (confirmEmail) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader
          title="Check your email"
          description={`We sent a confirmation link to ${confirmEmail}. Open it to activate your account, then sign in.`}
        />
        <Link to="/login" className="inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold">
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Create account" />
      <form
        noValidate
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setTouched({ firstName: true, lastName: true, phone: true, cnic: true, area: true, address: true, confirm: true })
          const first = Object.values(errors).find(Boolean)
          if (first) {
            setError(first)
            return
          }
          if (form.password !== form.confirm) {
            setError('Passwords do not match.')
            return
          }
          setBusy(true)
          setError('')
          try {
            const result = await register(form)
            if (result?.pendingConfirmation) {
              setConfirmEmail(result.email)
              return
            }
            push('Account created — welcome to AquaFizz!')
            navigate(location.state?.from || '/profile', { replace: true })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-3">
          <Field id="firstName" label="First name" hint={show('firstName') ? <span className="text-red-600">{show('firstName')}</span> : null}>
            <input
              id="firstName"
              required
              autoComplete="given-name"
              aria-invalid={Boolean(show('firstName'))}
              className={inputClass}
              value={form.firstName}
              onChange={set('firstName', lettersOnly)}
              onBlur={blur('firstName')}
            />
          </Field>
          <Field id="lastName" label="Last name" hint={show('lastName') ? <span className="text-red-600">{show('lastName')}</span> : null}>
            <input
              id="lastName"
              required
              autoComplete="family-name"
              aria-invalid={Boolean(show('lastName'))}
              className={inputClass}
              value={form.lastName}
              onChange={set('lastName', lettersOnly)}
              onBlur={blur('lastName')}
            />
          </Field>
        </div>
        <Field id="email" label="Email">
          <input id="email" type="email" required autoComplete="email" className={inputClass} value={form.email} onChange={set('email')} />
        </Field>
        <Field
          id="phone"
          label="Mobile number"
          hint={
            show('phone') ? (
              <span className="text-red-600">{show('phone')}</span>
            ) : (
              '11 digits starting with 03, e.g. 03001234567.'
            )
          }
        >
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            required
            maxLength={12}
            autoComplete="tel-national"
            placeholder="03XXXXXXXXX"
            aria-invalid={Boolean(show('phone'))}
            className={inputClass}
            value={form.phone}
            onChange={set('phone', normalizePhone)}
            onBlur={blur('phone')}
          />
        </Field>
        <Field
          id="cnic"
          label="CNIC number"
          hint={show('cnic') ? <span className="text-red-600">{show('cnic')}</span> : '13 digits, e.g. 42101-1234567-1.'}
        >
          <input
            id="cnic"
            inputMode="numeric"
            required
            maxLength={15}
            placeholder="XXXXX-XXXXXXX-X"
            aria-invalid={Boolean(show('cnic'))}
            className={inputClass}
            value={form.cnic}
            onChange={set('cnic', formatCnic)}
            onBlur={blur('cnic')}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="province" label="Province">
            <input id="province" readOnly className={`${inputClass} bg-slate-50`} value={PROVINCE} />
          </Field>
          <Field id="area" label="District" hint={show('area') ? <span className="text-red-600">{show('area')}</span> : null}>
            <select id="area" required className={inputClass} value={form.area} onChange={set('area')} onBlur={blur('area')}>
              <option value="">Select district</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="address" label="Address" hint={show('address') ? <span className="text-red-600">{show('address')}</span> : 'House / flat, street and area.'}>
          <textarea
            id="address"
            required
            rows={2}
            autoComplete="street-address"
            aria-invalid={Boolean(show('address'))}
            className={inputClass}
            value={form.address}
            onChange={set('address')}
            onBlur={blur('address')}
          />
        </Field>
        <Field id="password" label="Password" hint="At least 6 characters.">
          <input id="password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} value={form.password} onChange={set('password')} />
        </Field>
        <Field id="confirm" label="Confirm password" hint={show('confirm') ? <span className="text-red-600">{show('confirm')}</span> : null}>
          <input id="confirm" type="password" required autoComplete="new-password" className={inputClass} value={form.confirm} onChange={set('confirm')} onBlur={blur('confirm')} />
        </Field>
        <SubmitButton busy={busy}>Sign up</SubmitButton>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link className="font-medium text-primary-dark" to="/login" state={location.state}>Login</Link>
      </p>
    </div>
  )
}

export function ForgotPasswordPage() {
  usePageSeo({ title: 'Reset password | AquaFizz' })
  const { push } = useToast()
  const navigate = useNavigate()
  // Opened from the admin login: send them back there afterwards.
  const loginPath = useLocation().state?.admin ? '/admin/login' : '/login'
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Reset password"
        description={
          step === 'request'
            ? usesSupabaseAuth
              ? 'Enter your account email and we will send you a reset link.'
              : 'Enter your account email and we will send you a 6-digit reset code.'
            : step === 'sent'
              ? `If an account exists for ${email}, a reset link is on its way. Open it on this device to choose a new password.`
              : `Enter the code sent to ${email} and choose a new password.`
        }
      />
      {step === 'request' ? (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              const issued = await requestPasswordReset(email)
              // Same response whether or not the email exists, so accounts can't be probed.
              setDemoCode(issued || '')
              setStep(usesSupabaseAuth ? 'sent' : 'reset')
            })
          }}
        >
          <FormError message={error} />
          <Field id="reset-email" label="Email">
            <input id="reset-email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <SubmitButton busy={busy}>{usesSupabaseAuth ? 'Send reset link' : 'Send reset code'}</SubmitButton>
        </form>
      ) : step === 'sent' ? (
        <button type="button" className="text-sm font-medium text-primary-dark" onClick={() => setStep('request')}>
          Didn&apos;t get it? Send again
        </button>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              await resetPassword({ email, code, password })
              push('Password updated — please sign in')
              navigate(loginPath)
            })
          }}
        >
          {demoCode ? (
            <p className="rounded-2xl bg-light-aqua px-4 py-3 text-sm">
              Demo mode (no email service yet): your code is <strong className="tracking-widest">{demoCode}</strong>
            </p>
          ) : null}
          <FormError message={error} />
          <Field id="reset-code" label="Reset code">
            <input id="reset-code" inputMode="numeric" required className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field id="reset-password" label="New password" hint="At least 6 characters.">
            <input id="reset-password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <SubmitButton busy={busy}>Update password</SubmitButton>
          <button type="button" className="text-sm text-slate-500" onClick={() => setStep('request')}>
            Use a different email
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        Remembered it? <Link className="font-medium text-primary-dark" to={loginPath}>Back to login</Link>
      </p>
    </div>
  )
}

/** Landing page for the Supabase password-recovery email link. */
export function ResetPasswordPage() {
  usePageSeo({ title: 'Choose a new password | AquaFizz' })
  const { user, ready } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!usesSupabaseAuth) return <Navigate to="/forgot-password" replace />
  if (!ready) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-primary">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="Link expired" description="This reset link is invalid or has expired. Request a new one." />
        <Link to="/forgot-password" className="inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold">
          Send a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Choose a new password" description={`For ${user.email}`} />
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (password !== confirm) {
            setError('Passwords do not match.')
            return
          }
          setBusy(true)
          setError('')
          try {
            await setNewPassword(password)
            push('Password updated')
            navigate(user.role === 'admin' ? '/admin' : '/profile', { replace: true })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <FormError message={error} />
        <Field id="new-password" label="New password" hint="At least 6 characters.">
          <input id="new-password" type="password" required minLength={6} autoComplete="new-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field id="new-password-confirm" label="Confirm new password">
          <input id="new-password-confirm" type="password" required autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <SubmitButton busy={busy}>Update password</SubmitButton>
      </form>
    </div>
  )
}
