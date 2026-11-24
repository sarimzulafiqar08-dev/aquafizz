import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Mobile-only back button. Goes to the previous page inside the app when there
 * is one (React Router keeps an `idx` in history.state), otherwise to `fallback`
 * so a page opened from a shared link or a fresh tab still has a way out.
 */
export function BackButton({ fallback = '/', label = 'Back', className = '' }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => {
        const idx = window.history.state?.idx
        if (typeof idx === 'number' && idx > 0) navigate(-1)
        else navigate(fallback, { replace: true })
      }}
      className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pr-3 pl-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200 md:hidden ${className}`}
      aria-label={label || 'Back'}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
