export const BRAND = {
  name: 'AquaFizz',
  tagline: 'Drinks On Demand',
  slogan: 'Thandak Jo Dil Khush Kar De',
}

export const CONTACT = {
  phone: import.meta.env.VITE_SUPPORT_PHONE || '+923020085811',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '923022666385',
  email: import.meta.env.VITE_SUPPORT_EMAIL || 'hello@aquafizz.pk',
  address: 'Shop No. 15, Saddar, Hyderabad, Sindh',
  hours: 'Daily 10:00 AM – 10:00 PM',
}

// Delivery covers Hyderabad city; its areas and delivery zone live in lib/hyderabad.js.
export { CITY, AREA_NAMES as AREAS } from './hyderabad'

export const DELIVERY_WINDOWS = [
  { id: 'asap', label: 'ASAP', hint: 'Fastest available slot' },
  { id: '30-60', label: '2–3 Days', hint: 'Standard delivery' }, // id kept for saved checkout drafts
  { id: '1-2', label: '1–2 Hours', hint: 'Flexible window' },
  { id: 'evening', label: 'Today Evening', hint: '6:00 PM – 10:00 PM' },
  { id: 'schedule', label: 'Schedule Delivery', hint: 'Pick a later time' },
]

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', requiresProof: false },
  { id: 'jazzcash', label: 'JazzCash', requiresProof: true },
  { id: 'easypaisa', label: 'Easypaisa', requiresProof: true },
  { id: 'bank', label: 'Bank Transfer', requiresProof: true },
]

// Defaults until an admin saves real details in Admin → Payments → Payment settings.
export const DEFAULT_PAYMENT_SETTINGS = {
  cod: { enabled: true },
  jazzcash: { enabled: true, accountTitle: 'AquaFizz', accountNumber: '' },
  easypaisa: { enabled: true, accountTitle: 'AquaFizz', accountNumber: '' },
  bank: { enabled: true, bankName: '', accountTitle: 'AquaFizz', accountNumber: '', iban: '' },
  instructions: 'Send the exact order total, then upload the payment screenshot and transaction ID.',
}

export const PAYMENT_STATUSES = {
  codPending: 'Pending (COD)',
  codConfirmed: 'COD confirmed',
  pending: 'Pending verification',
  paid: 'Paid',
  rejected: 'Rejected',
  refunded: 'Refunded',
}

/** What a customer sees for each payment status: a short label, a colour and a one-line note. */
export const PAYMENT_STATUS_INFO = {
  [PAYMENT_STATUSES.codPending]: {
    label: 'Waiting for confirmation',
    tone: 'amber',
    note: 'We will confirm your Cash on Delivery order shortly.',
  },
  [PAYMENT_STATUSES.codConfirmed]: {
    label: 'Order confirmed',
    tone: 'emerald',
    note: 'Confirmed by AquaFizz — please keep the cash ready for the rider.',
  },
  [PAYMENT_STATUSES.pending]: {
    label: 'Checking your payment',
    tone: 'amber',
    note: 'Our team is verifying your payment screenshot.',
  },
  [PAYMENT_STATUSES.paid]: {
    label: 'Payment confirmed',
    tone: 'emerald',
    note: 'Your payment was received and your order is confirmed.',
  },
  [PAYMENT_STATUSES.rejected]: {
    label: 'Payment not accepted',
    tone: 'red',
    note: 'We could not verify this payment. Please contact us on WhatsApp.',
  },
  [PAYMENT_STATUSES.refunded]: { label: 'Refunded', tone: 'slate', note: 'This payment was refunded.' },
}

export const PROMO_CODES = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off' },
}

// Order of brand sections on the Shop page. Brands not listed here go after the soft drinks
// (before the water brands at the end), largest first.
export const BRAND_ORDER = ['Pepsi', '7up', 'Dew', 'Mirinda', 'Sting', 'Gormy Cola', 'Quice', 'Slice', 'Bravo']
export const BRAND_ORDER_LAST = ['Aqua', 'Aquafina']

/** Sort key for a brand name: listed brands in order, unknown ones next, water brands last. */
export function brandRank(brand) {
  const key = String(brand || '').trim().toLowerCase()
  const first = BRAND_ORDER.findIndex((b) => b.toLowerCase() === key)
  if (first !== -1) return first
  const last = BRAND_ORDER_LAST.findIndex((b) => b.toLowerCase() === key)
  if (last !== -1) return 1000 + last
  return 500
}

// Cash on Delivery is only offered up to this order total; bigger orders are paid in advance.
// Keep in sync with place_order() in supabase/migrations/*_hyderabad_delivery_area.sql.
export const COD_MAX_TOTAL = 10000

export const DELIVERY_FEE = 149
export const FREE_DELIVERY_MIN = 2500

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/products?deals=1', label: 'Deals' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const LIVE = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
// The live (Supabase) store uses its own keys so leftover demo data in a browser is ignored.
const key = (name) => (LIVE ? `aquafizz_live_${name}` : `aquafizz_${name}`)

export const STORAGE_KEYS = {
  cart: key('cart'),
  wishlist: key('wishlist'),
  checkout: key('checkout'),
  orders: key('orders'),
  messages: key('messages'),
  user: 'aquafizz_user',
  admin: 'aquafizz_admin',
  products: 'aquafizz_products',
  productsSeed: 'aquafizz_products_seed_version',
  users: 'aquafizz_users',
  resets: 'aquafizz_password_resets',
  paymentSettings: 'aquafizz_payment_settings',
}

export const ROLES = { user: 'user', admin: 'admin' }

// Demo admin seeded into the local users table on first load (demo mode only).
// Vite inlines the env vars at build time, so when Supabase is configured this
// folds to null and the demo password never ships in the production bundle.
export const DEMO_ADMIN =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? null
    : {
        name: 'AquaFizz Admin',
        email: 'admin@aquafizz.pk',
        password: 'Admin@123',
      }

export const ORDER_STATUSES = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled']

export const MAX_PRODUCT_IMAGES = 6

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Size: Small to Large' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'newest', label: 'Newest' },
]
