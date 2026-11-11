import { DEFAULT_PAYMENT_SETTINGS, PAYMENT_METHODS, STORAGE_KEYS } from '../lib/constants'
import { fileToCompressedDataUrl } from '../lib/images'
import { readJson, wait, writeJson } from '../lib/storage'
import { supabase, unwrap } from './supabaseClient'

/**
 * Payment settings (account details shown at checkout) and payment proofs.
 * Supabase: public.store_settings row 'payment' + private 'payment-proofs' bucket.
 * Demo mode: browser storage.
 */

const PROOFS_BUCKET = 'payment-proofs'

function merge(saved) {
  const base = DEFAULT_PAYMENT_SETTINGS
  return {
    ...base,
    ...saved,
    cod: { ...base.cod, ...saved?.cod },
    jazzcash: { ...base.jazzcash, ...saved?.jazzcash },
    easypaisa: { ...base.easypaisa, ...saved?.easypaisa },
    bank: { ...base.bank, ...saved?.bank },
  }
}

export async function getPaymentSettings() {
  if (supabase) {
    const row = unwrap(await supabase.from('store_settings').select('value').eq('key', 'payment').maybeSingle())
    return merge(row?.value)
  }
  await wait(150)
  return merge(readJson(STORAGE_KEYS.paymentSettings, null))
}

const digits = (v) => String(v || '').replace(/[^\d]/g, '')

function validateSettings(s) {
  for (const id of ['jazzcash', 'easypaisa']) {
    const m = s[id]
    if (!m.enabled) continue
    const label = id === 'jazzcash' ? 'JazzCash' : 'Easypaisa'
    if (!digits(m.accountNumber)) throw new Error(`${label} is enabled but has no number. Add the number or turn ${label} off.`)
    if (!/^03\d{9}$/.test(digits(m.accountNumber))) throw new Error(`${label} number must be 11 digits, e.g. 03001234567.`)
    if (!m.accountTitle?.trim()) throw new Error(`${label} account title is required.`)
  }
  if (s.bank.enabled) {
    if (!s.bank.bankName?.trim() || !s.bank.accountTitle?.trim() || !s.bank.accountNumber?.trim()) {
      throw new Error('Bank transfer needs bank name, account title and account number.')
    }
    const iban = s.bank.iban.replace(/\s/g, '').toUpperCase()
    if (iban && !/^PK\d{2}[A-Z]{4}\d{16}$/.test(iban)) throw new Error('IBAN should look like PK36SCBL0000001123456702 (24 characters).')
  }
  if (!PAYMENT_METHODS.some((m) => s[m.id]?.enabled)) throw new Error('Keep at least one payment method enabled.')
}

export async function savePaymentSettings(input) {
  const next = merge(input)
  next.bank.iban = next.bank.iban.replace(/\s/g, '').toUpperCase()
  next.bank.accountNumber = next.bank.accountNumber.replace(/\s/g, '')
  next.jazzcash.accountNumber = digits(next.jazzcash.accountNumber)
  next.easypaisa.accountNumber = digits(next.easypaisa.accountNumber)
  validateSettings(next)
  if (supabase) {
    unwrap(
      await supabase
        .from('store_settings')
        .upsert({ key: 'payment', value: next, updated_at: new Date().toISOString() }),
    )
    return next
  }
  await wait(200)
  writeJson(STORAGE_KEYS.paymentSettings, next)
  return next
}

/** A method is usable at checkout when enabled and its account details are filled in. */
export function isMethodReady(settings, id) {
  const m = settings[id]
  if (!m?.enabled) return false
  if (id === 'cod') return true
  if (id === 'bank') return Boolean(m.bankName && m.accountNumber)
  return Boolean(m.accountNumber)
}

/** Uploads a proof screenshot. Returns a storage path (Supabase) or a data URL (demo mode). */
export async function uploadPaymentProof(file) {
  const dataUrl = await fileToCompressedDataUrl(file, 1400, 0.82)
  if (!supabase) return dataUrl
  const blob = await (await fetch(dataUrl)).blob()
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`
  unwrap(await supabase.storage.from(PROOFS_BUCKET).upload(path, blob, { contentType: 'image/jpeg' }))
  return path
}

/** Viewable URL for a stored proof (signed, short-lived on Supabase). */
export async function getProofUrl(proof) {
  if (!proof) return ''
  if (proof.startsWith('data:') || proof.startsWith('http')) return proof
  if (!supabase) return ''
  const data = unwrap(await supabase.storage.from(PROOFS_BUCKET).createSignedUrl(proof, 60 * 10))
  return data.signedUrl
}
