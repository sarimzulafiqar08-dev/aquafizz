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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/products?category=${cat.slug}`}
            className="group overflow-hidden rounded-2xl border border-slate-100 sm:rounded-3xl"
          >
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              className="h-32 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-52"
            />
            <div className="p-3 sm:p-6">
              <h2 className="text-sm font-semibold sm:text-xl">{cat.name}</h2>
              <p className="mt-1 text-xs text-slate-600 sm:mt-2 sm:text-base">{cat.description}</p>
              <span className="mt-2 inline-flex text-xs font-semibold text-primary-dark sm:mt-4 sm:rounded-full sm:bg-primary sm:px-4 sm:py-2 sm:text-sm sm:text-black">
                View Products →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
