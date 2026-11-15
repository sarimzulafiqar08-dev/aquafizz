import { GlassWater } from 'lucide-react'
import { useState } from 'react'

/**
 * Product photo with a tidy fallback: when a product has no image (or it fails to load)
 * show a branded tile instead of the browser's broken-image icon and alt text.
 */
export function ProductImage({ src, alt, brand, className = '', compact = false }) {
  const [failedSrc, setFailedSrc] = useState('')
  if (src && failedSrc !== src) {
    return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailedSrc(src)} />
  }
  return (
    <div
      role="img"
      aria-label={alt || 'No photo yet'}
      className={`${className} flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-light-aqua to-white text-primary-dark`}
    >
      <GlassWater className={compact ? 'h-5 w-5' : 'h-10 w-10'} aria-hidden="true" />
      {!compact && brand ? <span className="text-sm font-semibold tracking-wide uppercase">{brand}</span> : null}
    </div>
  )
}
