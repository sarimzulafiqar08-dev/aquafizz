import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Field, inputClass } from '../../components/Field'
import { FormError, PageHeader, Spinner } from '../../components/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { usePageSeo } from '../../hooks/usePageSeo'
import { DEMO_ADMIN, ROLES } from '../../lib/constants'
import { usesSupabaseAuth } from '../../services/authService'

export function AdminLoginPage() {
  usePageSeo({ title: 'Admin login | AquaFizz' })
  const { login, logout, isAdmin } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (isAdmin) return <Navigate to="/admin" replace />

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <form
        className="w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-lg"
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          setBusy(true)
          setError('')
          try {
            const account = await login({ email: data.get('email'), password: data.get('password') })
            if (account.role !== ROLES.admin) {
              logout()
              throw new Error('This account does not have admin access.')
            }
            push('Signed in to the admin dashboard')
            navigate(location.state?.from || '/admin', { replace: true })
          } catch (err) {
            setError(err.message)
            setBusy(false)
          }
        }}
      >
        <PageHeader title="AquaFizz Admin" description="Dashboard access for operations staff." />
        <div className="grid gap-4">
          <FormError message={error} />
          <Field id="admin-email" label="Email">
            <input id="admin-email" name="email" type="email" autoComplete="email" required className={inputClass} />
          </Field>
          <Field id="admin-pass" label="Password">
            <input id="admin-pass" name="password" type="password" autoComplete="current-password" required className={inputClass} />
          </Field>
          <Link to="/forgot-password" state={{ admin: true }} className="-mt-2 justify-self-end text-sm font-medium text-primary-dark">
            Forgot password?
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            Sign in
          </button>
          {usesSupabaseAuth ? null : (
            <p className="rounded-2xl bg-light-aqua px-4 py-3 text-xs text-slate-600">
              Demo admin: <strong>{DEMO_ADMIN.email}</strong> / <strong>{DEMO_ADMIN.password}</strong>
            </p>
          )}
          <Link to="/" className="text-center text-sm text-slate-500 hover:text-black">
            Back to store
          </Link>
        </div>
      </form>
    </div>
  )
}
