import { lazy, Suspense } from 'react'

const LocationPicker = lazy(() => import('./LocationPicker'))

/** Loads the map bundle (Leaflet) only on pages that show a map. */
export function LazyLocationPicker(props) {
  return (
    <Suspense fallback={<div className={`animate-pulse rounded-3xl bg-light-aqua ${props.height || 'h-72'}`} />}>
      <LocationPicker {...props} />
    </Suspense>
  )
}
