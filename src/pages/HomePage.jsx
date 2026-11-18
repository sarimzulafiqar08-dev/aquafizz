import { Link } from 'react-router-dom'
import { categories } from '../lib/catalog'
import { usePageSeo } from '../hooks/usePageSeo'

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
            <p className="mt-4 max-w-md text-lg text-slate-600">Cold drinks, mineral water aur juices.</p>
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
          {/* Same 8:5 shape as the collage, so none of its three photos gets cropped; smaller on phones. */}
          <div className="relative mx-auto w-full max-w-xs animate-fade-in sm:max-w-sm md:max-w-none">
            <img
              src="/images/categories/deal-boxes.jpg"
              alt="Pepsi can, a glass of water and orange juice"
              className="aspect-[8/5] w-full rounded-[1.5rem] object-cover shadow-xl md:rounded-[2rem]"
            />
            <p className="absolute bottom-3 left-3 rounded-2xl bg-white/90 px-3 py-1.5 text-xs font-medium text-teal-deep shadow md:bottom-4 md:left-4 md:px-4 md:py-2 md:text-sm">
              Fast delivery to your door
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">Shop by category</h2>
          <Link to="/categories" className="text-sm font-medium text-primary-dark">
            All categories
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(19_143_150_/_0.1)] sm:rounded-3xl"
            >
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="h-28 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
              />
              <div className="p-3 sm:p-5">
                <h3 className="text-sm font-semibold sm:text-lg">{cat.name}</h3>
                <p className="mt-1 hidden text-sm text-slate-600 sm:block">{cat.description}</p>
                <span className="mt-2 inline-flex text-xs font-semibold text-primary-dark sm:mt-4 sm:rounded-full sm:bg-light-aqua sm:px-4 sm:py-2 sm:text-sm sm:text-black">
                  View Products →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
