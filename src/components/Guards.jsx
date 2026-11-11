import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from './Feedback'

function SessionLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-primary" role="status" aria-label="Loading your account">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function RequireUser({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <SessionLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function RequireAdmin({ children }) {
  const { user, isAdmin, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <SessionLoading />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center px-4">
        <EmptyState
          title="Admins only"
          description={`You're signed in as ${user.email}, which doesn't have admin access.`}
          action={
            <Link to="/" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold">
              Back to store
            </Link>
          }
        />
      </div>
    )
  }
  return children
}
