export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-light-aqua/60 px-6 py-14 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-red-800">{title}</h2>
      {description ? <p className="mt-2 text-sm text-red-700">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          className="mt-4 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-100">
      <div className="h-48 bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="mb-8 animate-fade-in">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-dark">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-slate-600">{description}</p> : null}
    </header>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  )
}

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  )
}
