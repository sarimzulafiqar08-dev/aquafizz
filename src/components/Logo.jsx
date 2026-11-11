import { Droplets } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ compact = false, inverted = false }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="AquaFizz home">
      <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-sm">
        <Droplets className="h-5 w-5" />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/80" />
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-bold tracking-tight ${inverted ? 'text-white' : ''}`}>
          AquaFizz
        </span>
        {compact ? null : (
          <span
            className={`hidden text-[11px] font-medium sm:block ${inverted ? 'text-primary' : 'text-primary-dark'}`}
          >
            Drinks On Demand
          </span>
        )}
      </span>
    </Link>
  )
}
