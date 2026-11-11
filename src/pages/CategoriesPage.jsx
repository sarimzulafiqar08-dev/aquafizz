import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Feedback'
import { usePageSeo } from '../hooks/usePageSeo'
import { categories } from '../lib/catalog'

export function CategoriesPage() {
  usePageSeo({
    title: 'Categories | AquaFizz',
    description: 'Browse AquaFizz categories: cold drinks, mineral water, juices and deal boxes.',
  })
  return (
    <div>
      <PageHeader eyebrow="Browse" title="Categories" description="Find the right chill for every moment." />
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <article key={cat.slug} className="overflow-hidden rounded-3xl border border-slate-100">
            <img src={cat.image} alt={cat.name} className="h-52 w-full object-cover" />
            <div className="p-6">
              <h2 className="text-xl font-semibold">{cat.name}</h2>
              <p className="mt-2 text-slate-600">{cat.description}</p>
              <Link
                to={`/products?category=${cat.slug}`}
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold"
              >
                View Products
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
