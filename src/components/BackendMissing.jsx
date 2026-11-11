import { CONTACT } from '../lib/constants'
import { Logo } from './Logo'

/** Shown by production builds that were deployed without Supabase keys. */
export function BackendMissing() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <h1 className="text-2xl font-bold">We&apos;ll be right back</h1>
      <p className="text-slate-600">
        The store is temporarily unavailable. To order now, message us on WhatsApp.
      </p>
      <a href={`https://wa.me/${CONTACT.whatsapp}`} className="rounded-full bg-primary px-6 py-3 font-semibold">
        Order on WhatsApp
      </a>
    </div>
  )
}
