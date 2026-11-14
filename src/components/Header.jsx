import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { NAV_LINKS } from '../lib/constants'
import { Logo } from './Logo'

export function Header() {
  const { summary } = useCart()
  const { user, isAdmin } = useAuth()
  const { ids: wishlistIds } = useWishlist()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  // While the menu is open: stop the page behind it scrolling, and close on Escape.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/products?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium ${
                  isActive && !link.to.includes('?') ? 'bg-light-aqua text-black' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:flex">
          <label className="sr-only" htmlFor="header-search">
            Search drinks
          </label>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="header-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pepsi, water, deals..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            to="/products"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-50 md:hidden"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            to={user ? '/profile' : '/login'}
            className="hidden h-11 w-11 place-items-center rounded-full hover:bg-slate-50 sm:grid"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/wishlist"
            className="relative hidden h-11 w-11 place-items-center rounded-full hover:bg-slate-50 sm:grid"
            aria-label={`Wishlist, ${wishlistIds.length} items`}
          >
            <Heart className="h-5 w-5" />
            {wishlistIds.length > 0 ? (
              <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-black">
                {wishlistIds.length}
              </span>
            ) : null}
          </Link>
          <Link
            to="/cart"
            className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-slate-50"
            aria-label={`Cart, ${summary.count} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {summary.count > 0 ? (
              <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-black">
                {summary.count}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Rendered into <body>: the header's backdrop-blur would otherwise trap this
          fixed overlay inside the header's own height on mobile browsers. */}
      {open ? createPortal(
        <div className="fixed inset-0 z-[60] bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute top-0 right-0 h-dvh w-[min(85%,20rem)] overflow-y-auto overscroll-contain bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">Menu</p>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mt-4 md:hidden">
              <label className="sr-only" htmlFor="mobile-search">
                Search drinks
              </label>
              <input
                id="mobile-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </form>
            <nav className="mt-4 grid gap-1" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-medium hover:bg-light-aqua"
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to={user ? '/profile' : '/login'} onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-medium hover:bg-light-aqua">
                Account
              </NavLink>
              <NavLink to="/wishlist" onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-medium hover:bg-light-aqua">
                Wishlist{wishlistIds.length ? ` (${wishlistIds.length})` : ''}
              </NavLink>
              <NavLink to="/orders" onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-medium hover:bg-light-aqua">
                Orders
              </NavLink>
              {isAdmin ? (
                <NavLink to="/admin" onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-medium hover:bg-light-aqua">
                  Admin dashboard
                </NavLink>
              ) : null}
            </nav>
          </div>
        </div>,
        document.body,
      ) : null}
    </header>
  )
}
