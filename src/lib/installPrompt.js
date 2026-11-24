import { useSyncExternalStore } from 'react'

/**
 * Tracks whether the app can be installed to the home screen.
 *
 * Chrome/Edge/Samsung fire `beforeinstallprompt` once, often before React has
 * mounted, so this module is imported from main.jsx to start listening at once.
 * iPhone Safari never fires it: there the user adds the app from the Share menu.
 */

let deferredPrompt = null
let installed = false
const listeners = new Set()
let snapshot = null

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function emit() {
  snapshot = null
  listeners.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  installed = isStandalone()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installed = true
    emit()
  })
}

function getSnapshot() {
  if (!snapshot) snapshot = { canPrompt: Boolean(deferredPrompt), installed, ios: isIos() }
  return snapshot
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Opens the browser's install dialog. Resolves to true if the user accepted. */
export async function promptInstall() {
  if (!deferredPrompt) return false
  const event = deferredPrompt
  deferredPrompt = null // a prompt event can only be used once
  emit()
  await event.prompt()
  const choice = await event.userChoice.catch(() => null)
  return choice?.outcome === 'accepted'
}

export function useInstallPrompt() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
