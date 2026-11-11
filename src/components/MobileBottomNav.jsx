import { Home, LayoutGrid, ShoppingBag, ClipboardList, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/products', label: 'Shop', icon: LayoutGrid },
  { to: '/cart', label: 'Cart', icon: ShoppingBag },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/profile', label: 'Account', icon: User },
]

export function MobileBottomNav() {
  const { summary } = useCart()
  return (
    <nav
      aria-label="Mobile bottom"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 rounded-2xl py-1 text-[11px] font-medium ${
                    isActive ? 'text-primary-dark' : 'text-slate-500'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.to === '/cart' && summary.count > 0 ? (
                    <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-black">
                      {summary.count}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
