import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Spinner } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/messages', label: 'Messages', icon: MessageCircle },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-slate-50 md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-slate-200 bg-white p-4 md:block">
        <Logo compact />
        <p className="mt-2 text-xs text-slate-500">Operations dashboard</p>
        <nav className="mt-6 grid gap-1" aria-label="Admin">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-light-aqua text-black' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{admin?.name || 'Admin'}</p>
            <p className="truncate text-xs text-slate-500">{admin?.email}</p>
          </div>
          <Link to="/" className="ml-auto mr-2 hidden rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 sm:inline-block">
            View store
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => {
              logout()
              navigate('/admin/login')
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden" aria-label="Admin mobile">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-primary text-black' : 'bg-slate-100 text-slate-600'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 md:p-8">
          <Suspense
            fallback={
              <div className="grid min-h-[40vh] place-items-center text-primary" role="status" aria-label="Loading page">
                <Spinner className="h-8 w-8" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
