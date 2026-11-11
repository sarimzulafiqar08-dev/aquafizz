/** Shared form rules. Keep in sync with the checks in supabase/migrations/*_validation_otp_map.sql. */

const NAME_RE = /^[A-Za-z]+(?: [A-Za-z]+)*$/
const PK_MOBILE_RE = /^03\d{9}$/

/**
 * Digits only, capped at 11. A number typed as +92 / 92… may grow to 12 digits and is then
 * converted to 03… (so typing "+92 300 1234567" ends as 03001234567). Use on every phone input change.
 */
export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('92')) return digits.length >= 12 ? `0${digits.slice(2, 12)}` : digits
  return digits.slice(0, 11)
}

export const isValidPhone = (value) => PK_MOBILE_RE.test(normalizePhone(value))

export function phoneError(value) {
  const phone = normalizePhone(value)
  if (!phone) return 'Enter your mobile number.'
  if (!phone.startsWith('03')) return 'Mobile number must start with 03.'
  if (phone.length !== 11) return `Mobile number must be exactly 11 digits (you entered ${phone.length}).`
  return ''
}

export const cleanName = (value) => String(value || '').trim().replace(/\s+/g, ' ')

export function nameError(value, label = 'Name') {
  const name = cleanName(value)
  if (!name) return `${label} is required.`
  if (!NAME_RE.test(name)) return `${label} can only contain letters (A–Z) and spaces.`
  if (name.length < 2) return `${label} is too short.`
  if (name.length > 40) return `${label} is too long.`
  return ''
}

/** Removes anything that isn't a letter or space while typing. */
export const lettersOnly = (value) => String(value || '').replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' ')

/** Great-circle distance in km. */
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export const hasLocation = (loc) => Number.isFinite(loc?.lat) && Number.isFinite(loc?.lng)

/** CNIC: digits only (max 13), shown as 12345-1234567-1 while typing. */
export function formatCnic(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}

export function cnicError(value) {
  const d = String(value || '').replace(/\D/g, '')
  if (!d) return 'Enter your CNIC number.'
  if (d.length !== 13) return `CNIC must be exactly 13 digits (you entered ${d.length}).`
  return ''
}

export function addressError(value) {
  const a = String(value || '').trim()
  if (!a) return 'Enter your address.'
  if (a.length < 8) return 'Please enter your full address (house, street, area).'
  return ''
}
