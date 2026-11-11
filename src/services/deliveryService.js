import { isInSindh } from '../lib/sindh'

/** Delivery area = the whole of Sindh. Mirrors public.in_sindh() in the database. */
export const isDeliverable = (location) => isInSindh(location)

/** Best-effort street address for a pin (OpenStreetMap Nominatim). Returns '' on failure. */
export async function reverseGeocode({ lat, lng }) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return ''
    const data = await res.json()
    const a = data.address || {}
    const parts = [a.house_number, a.road, a.neighbourhood || a.residential, a.suburb || a.village || a.town || a.city].filter(Boolean)
    return parts.length ? [...new Set(parts)].join(', ') : String(data.display_name || '').split(',').slice(0, 3).join(',')
  } catch {
    return ''
  }
}
