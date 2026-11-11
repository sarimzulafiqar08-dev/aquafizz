export const BRAND = {
  name: 'AquaFizz',
  tagline: 'Drinks On Demand',
  slogan: 'Thandak Jo Dil Khush Kar De',
}

export const CONTACT = {
  phone: import.meta.env.VITE_SUPPORT_PHONE || '+923020085811',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '923022666385',
  email: import.meta.env.VITE_SUPPORT_EMAIL || 'hello@aquafizz.pk',
  address: 'Shop 12, Block 13-C, Gulshan-e-Iqbal, Karachi',
  hours: 'Daily 10:00 AM – 10:00 PM',
}

// Delivery covers the whole of Sindh; districts and boundary live in lib/sindh.js.
export { PROVINCE, DISTRICT_NAMES as DISTRICTS } from './sindh'

export const DELIVERY_WINDOWS = [
  { id: 'asap', label: 'ASAP', hint: 'Fastest available slot' },
  { id: '30-60', label: '30–60 Minutes', hint: 'Standard delivery' },
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
  pending: 'Pending verification',
  paid: 'Paid',
  rejected: 'Rejected',
  refunded: 'Refunded',
}

export const PROMO_CODES = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off' },
}

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
  user: 'aquafizz_user',
  admin: 'aquafizz_admin',
  products: 'aquafizz_products',
  productsSeed: 'aquafizz_products_seed_version',
  users: 'aquafizz_users',
  resets: 'aquafizz_password_resets',
  paymentSettings: 'aquafizz_payment_settings',
}

export const ROLES = { user: 'user', admin: 'admin' }

// Demo admin seeded into the local users table on first load.
export const DEMO_ADMIN = {
  name: 'AquaFizz Admin',
  email: 'admin@aquafizz.pk',
  password: 'Admin@123',
}

export const ORDER_STATUSES = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled']

export const MAX_PRODUCT_IMAGES = 6

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name', label: 'Name A–Z' },
  { id: 'newest', label: 'Newest' },
]
