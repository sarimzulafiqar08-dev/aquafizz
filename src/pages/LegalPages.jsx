import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Feedback'
import { usePageSeo } from '../hooks/usePageSeo'

export function PrivacyPage() {
  usePageSeo({
    title: 'Privacy Policy | AquaFizz',
    description: 'How AquaFizz handles customer information on this storefront.',
  })
  return (
    <article className="max-w-3xl space-y-4 text-slate-600">
      <PageHeader title="Privacy Policy" />
      <p>
        AquaFizz collects only what is needed to deliver drinks: name, phone, address, area and order items. Cart and
        checkout drafts currently stay in your browser. When Supabase is connected, order and account data will be stored
        on our secured servers.
      </p>
      <p>We do not sell personal information. Payment proofs are used only to verify transfers.</p>
    </article>
  )
}

export function TermsPage() {
  usePageSeo({
    title: 'Terms & Conditions | AquaFizz',
    description: 'Terms for ordering drinks from AquaFizz.',
  })
  return (
    <article className="max-w-3xl space-y-4 text-slate-600">
      <PageHeader title="Terms & Conditions" />
      <p>
        Orders are subject to stock, delivery area coverage, and confirmation of online payments. Cash on
        delivery remains available. Prices are listed in PKR and may change.
      </p>
      <p>
        Promo code WELCOME10 applies a 10% discount on product subtotal as shown at checkout. AquaFizz may refuse orders
        that cannot be fulfilled safely or on time.
      </p>
    </article>
  )
}

export function NotFoundPage() {
  usePageSeo({ title: 'Page not found | AquaFizz' })
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">Check the link or head back to the shop.</p>
        <Link to="/products" className="mt-6 inline-block rounded-full bg-primary px-5 py-3 font-semibold">
          Shop drinks
        </Link>
    </div>
  )
}
