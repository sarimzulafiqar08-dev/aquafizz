import { Link } from 'react-router-dom'
import { categories } from '../lib/catalog'
import { ProductCard } from '../components/ProductCard'
import { usePageSeo } from '../hooks/usePageSeo'
import { useProducts } from '../hooks/useProducts'

function Bubbles() {
  const specs = [
    { left: '8%', bottom: '12%', size: 10, delay: '0s' },
    { left: '18%', bottom: '28%', size: 16, delay: '1.2s' },
    { left: '72%', bottom: '18%', size: 12, delay: '0.4s' },
    { left: '84%', bottom: '36%', size: 20, delay: '2s' },
    { left: '60%', bottom: '8%', size: 8, delay: '1.6s' },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {specs.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{
            left: b.left,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}

export function HomePage() {
  usePageSeo({
    title: 'AquaFizz – Drinks On Demand',
    description:
      'Cold drinks, mineral water aur juices — ab ghar tak fast delivery ke saath.',
  })
  const { products } = useProducts()
  const featured = products.filter((p) => p.featured)

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-light-aqua via-white to-primary/20 px-6 py-12 md:px-12 md:py-16">
        <Bubbles />
        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div className="animate-fade-in">
            <p className="text-sm font-semibold tracking-[0.2em] text-primary-dark uppercase">
              AquaFizz
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-bold md:text-5xl">
              Thandak Jo Dil Khush Kar De
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-600">
              Cold drinks, mineral water aur juices — ab ghar tak fast delivery ke saath.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-primary-dark hover:text-white"
              >
                Shop Now
              </Link>
              <Link
                to="/products?deals=1"
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
              >
                View Deals
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in">
            <img
              src="https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=1100&q=80"
              alt="Chilled bottled drinks with condensation"
              className="h-72 w-full rounded-[2rem] object-cover shadow-xl md:h-[26rem]"
            />
            <p className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-4 py-2 text-sm font-medium shadow">
              Fast delivery to your door
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Shop by category</h2>
          <Link to="/categories" className="text-sm font-medium text-primary-dark">
            All categories
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <article
              key={cat.slug}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0_194_209_/_0.08)]"
            >
              <img src={cat.image} alt={cat.name} className="h-40 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-lg font-semibold">{cat.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{cat.description}</p>
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="mt-4 inline-flex rounded-full bg-light-aqua px-4 py-2 text-sm font-semibold"
                >
                  View Products
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Link to="/products" className="text-sm font-medium text-primary-dark">
            Shop all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
