import { Link } from 'react-router-dom'
import { CONTACT } from '../lib/constants'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm text-slate-300">
            Fresh drinks, cold beverages and quality water delivered conveniently to your doorstep.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Links</h2>
          <ul className="mt-4 grid gap-2 text-sm text-slate-300">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/products" className="hover:text-primary">Shop</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
            <li><Link to="/admin" className="hover:text-primary">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Support</h2>
          <ul className="mt-4 grid gap-2 text-sm text-slate-300">
            <li>Phone: {CONTACT.phone}</li>
            <li>
              WhatsApp:{' '}
              <a className="hover:text-primary" href={`https://wa.me/${CONTACT.whatsapp}`}>
                Chat now
              </a>
            </li>
            <li>
              Email: <a className="hover:text-primary" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            <li>{CONTACT.hours}</li>
            <li>{CONTACT.address}</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} AquaFizz. Drinks On Demand.
      </p>
    </footer>
  )
}
