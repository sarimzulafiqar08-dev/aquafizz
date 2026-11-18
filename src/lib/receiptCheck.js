/**
 * Reads the text on a payment screenshot (OCR, in the browser) and checks that it is a receipt
 * from the payment method the customer picked: JazzCash, Easypaisa or a bank transfer.
 * The OCR library (~a few MB with its language data) is loaded only when a screenshot is picked.
 *
 * This is a first filter so obviously wrong pictures are refused at once; the admin still
 * reviews every online payment before dispatch.
 */

// Words that appear on receipts from each method. Matched after lower-casing and removing
// spaces/punctuation, so "Jazz Cash", "JAZZCASH" and "jazz-cash" all count.
const BRAND_WORDS = {
  jazzcash: ['jazzcash', 'jazz', 'mobilink'],
  easypaisa: ['easypaisa', 'easypaise', 'telenormicrofinance', 'telenorbank'],
  bank: ['bank', 'ibft', 'raast', 'fundstransfer', 'fundtransfer', 'iban', 'interbank'],
}

const squash = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Words to look for when `methodId` was chosen (bank also uses the store's bank name). */
export function receiptWords(methodId, settings) {
  const words = [...(BRAND_WORDS[methodId] || [])]
  if (methodId === 'bank' && settings?.bank?.bankName) {
    // "Meezan Bank" → also accept "meezan" on its own.
    for (const part of settings.bank.bankName.split(/\s+/)) {
      const w = squash(part)
      if (w.length >= 3 && w !== 'bank' && w !== 'limited' && w !== 'ltd') words.push(w)
    }
  }
  return words
}

/** True if the OCR text names the chosen payment method. */
export function textMatchesMethod(text, methodId, settings) {
  const flat = squash(text)
  return receiptWords(methodId, settings).some((w) => flat.includes(w))
}

/** Scales a large screenshot down so OCR stays quick on phones. Returns a canvas or the file. */
async function prepare(file) {
  if (typeof createImageBitmap !== 'function') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas
}

/**
 * Checks a screenshot against the chosen method.
 * Resolves to { ok: true } or { ok: false, reason } — `reason` is shown to the customer.
 */
export async function checkReceipt(file, methodId, methodLabel, settings) {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(await prepare(file))
    if (textMatchesMethod(data.text, methodId, settings)) return { ok: true }
    return {
      ok: false,
      reason:
        methodId === 'bank'
          ? 'This screenshot does not look like a bank transfer receipt. Please upload the receipt from your banking app.'
          : `This screenshot does not look like a ${methodLabel} receipt. Please upload the receipt from your ${methodLabel} app.`,
    }
  } finally {
    await worker.terminate()
  }
}
