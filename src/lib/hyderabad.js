/**
 * Delivery area: Hyderabad city. The shop is in Hyderabad and delivers within
 * DELIVERY_RADIUS_KM of SHOP_LOCATION. Customers pick one of Hyderabad's main areas and
 * pin their exact location on the map.
 *
 * Keep SHOP_LOCATION, DELIVERY_RADIUS_KM and AREAS in sync with public.in_delivery_area()
 * and public.hyderabad_areas() in supabase/migrations/*_hyderabad_delivery_area.sql.
 */

import { distanceKm } from './validation'

export const CITY = 'Hyderabad'

/** Centre of the delivery zone (the shop, Saddar). */
export const SHOP_LOCATION = { lat: 25.385, lng: 68.36 }

/** Orders are accepted for pins up to this far from the shop. */
export const DELIVERY_RADIUS_KM = 50

/** Main areas of Hyderabad plus nearby towns. lat/lng are approximate centres, used to move the map. */
export const AREAS = [
  { name: 'Latifabad', lat: 25.3633, lng: 68.378 },
  { name: 'Qasimabad', lat: 25.3925, lng: 68.326 },
  { name: 'Hirabad', lat: 25.404, lng: 68.367 },
  { name: 'Saddar', lat: 25.385, lng: 68.37 },
  { name: 'Cantonment', lat: 25.364, lng: 68.352 },
  { name: 'Hyderabad City (Old City)', lat: 25.398, lng: 68.364 },
  { name: 'Gari Khata', lat: 25.393, lng: 68.374 },
  { name: 'Paretabad', lat: 25.414, lng: 68.361 },
  { name: 'Hussainabad', lat: 25.412, lng: 68.375 },
  { name: 'Liaquat Colony', lat: 25.402, lng: 68.357 },
  { name: 'Citizen Colony', lat: 25.404, lng: 68.333 },
  { name: 'Wadhu Wah', lat: 25.421, lng: 68.312 },
  { name: 'Autobhan Road', lat: 25.38, lng: 68.346 },
  { name: 'GOR Colony', lat: 25.379, lng: 68.36 },
  { name: 'Hala Naka', lat: 25.443, lng: 68.381 },
  { name: 'Kohsar', lat: 25.353, lng: 68.383 },
  // Nearby towns inside the delivery radius
  { name: 'Jamshoro', lat: 25.43, lng: 68.28, zoom: 14 },
  { name: 'Kotri', lat: 25.37, lng: 68.31, zoom: 14 },
  { name: 'Tando Muhammad Khan', lat: 25.1232, lng: 68.5359, zoom: 14 },
  { name: 'Tando Allahyar', lat: 25.46, lng: 68.72, zoom: 14 },
].map((a) => ({ zoom: 15, ...a }))

export const AREA_NAMES = AREAS.map((a) => a.name)

export const findArea = (name) => AREAS.find((a) => a.name === name) || null

/** True when the pin is inside the delivery zone. */
export function isInDeliveryArea(loc) {
  if (!Number.isFinite(loc?.lat) || !Number.isFinite(loc?.lng)) return false
  return distanceKm(SHOP_LOCATION, loc) <= DELIVERY_RADIUS_KM
}
