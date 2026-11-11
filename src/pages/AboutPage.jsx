import { PageHeader } from '../components/Feedback'
import { usePageSeo } from '../hooks/usePageSeo'

export function AboutPage() {
  usePageSeo({
    title: 'About AquaFizz',
    description: 'Fresh drinks, cold beverages and quality water delivered to your doorstep.',
  })
  return (
    <article className="max-w-3xl">
      <PageHeader eyebrow="Our story" title="About AquaFizz" />
      <p className="text-lg text-slate-600">
        Fresh drinks, cold beverages and quality water delivered conveniently to your doorstep.
      </p>
      <p className="mt-4 text-slate-600">
        AquaFizz started with a simple promise: thandak should not wait. We pick Pepsi, 7UP, Mountain Dew,
        Aquafina, Slice and curated deal boxes, keep them cold, and send them across Gulshan, DHA, North Nazimabad and
        beyond.
      </p>
      <p className="mt-4 text-slate-600">
        We are building a premium beverage delivery platform — modern, energetic and dependable — so households, offices
        and gatherings can tap Shop Now and get drinks on demand.
      </p>
    </article>
  )
}
