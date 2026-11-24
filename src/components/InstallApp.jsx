import { Download, Droplets, MoreVertical, PlusSquare, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { promptInstall, useInstallPrompt } from '../lib/installPrompt'

const BANNER_KEY = 'aquafizz_install_banner_hidden'

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-black">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  )
}

/** Steps for browsers that give no install prompt (iPhone Safari, or Chrome before it is ready). */
function InstallHelp({ ios, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-end bg-black/40 p-3 sm:place-items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Download the AquaFizz app"
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Download the AquaFizz app</p>
            <p className="mt-1 text-sm text-slate-500">Free — opens from your home screen like any other app.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="mt-5 grid gap-3 text-sm text-slate-700">
          {ios ? (
            <>
              <Step n={1}>
                Open this page in <strong>Safari</strong>.
              </Step>
              <Step n={2}>
                Tap the <strong>Share</strong> button <Share className="inline h-4 w-4 align-[-2px]" /> at the bottom.
              </Step>
              <Step n={3}>
                Choose <strong>Add to Home Screen</strong> <PlusSquare className="inline h-4 w-4 align-[-2px]" />, then tap <strong>Add</strong>.
              </Step>
            </>
          ) : (
            <>
              <Step n={1}>
                Open this page in <strong>Chrome</strong>.
              </Step>
              <Step n={2}>
                Tap the menu <MoreVertical className="inline h-4 w-4 align-[-2px]" /> at the top right.
              </Step>
              <Step n={3}>
                Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then tap <strong>Install</strong>.
              </Step>
            </>
          )}
        </ol>
        <button type="button" onClick={onClose} className="mt-6 w-full rounded-full bg-black py-3 text-sm font-semibold text-white">
          Got it
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** Shared click handler: the browser's own install dialog when it has one, otherwise our steps. */
function useInstallAction() {
  const state = useInstallPrompt()
  const [help, setHelp] = useState(false)
  const install = async () => {
    if (state.canPrompt) await promptInstall()
    else setHelp(true)
  }
  const helpDialog = help ? <InstallHelp ios={state.ios} onClose={() => setHelp(false)} /> : null
  return { state, install, helpDialog }
}

/** "Download App" button. Hidden once the app is installed (or opened from the home screen). */
export function InstallAppButton({ className = '', label = 'Download App', onClick }) {
  const { state, install, helpDialog } = useInstallAction()
  if (state.installed) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onClick?.()
          install()
        }}
        className={`inline-flex items-center gap-2 ${className}`}
      >
        <Download className="h-4 w-4" />
        {label}
      </button>
      {helpDialog}
    </>
  )
}

/** Dismissible mobile-only card for the home page. */
export function InstallAppBanner({ className = '' }) {
  const { state, install, helpDialog } = useInstallAction()
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem(BANNER_KEY) === '1'
    } catch {
      return false
    }
  })

  if (state.installed || hidden) return helpDialog

  const dismiss = () => {
    setHidden(true)
    try {
      window.localStorage.setItem(BANNER_KEY, '1')
    } catch {
      // storage blocked: the banner just comes back next visit
    }
  }

  return (
    <>
      <div className={`flex items-center gap-3 rounded-3xl border border-primary/30 bg-light-aqua p-3 md:hidden ${className}`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm" aria-hidden="true">
          <Droplets className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Get the AquaFizz app</p>
          <p className="text-xs text-slate-600">Order faster from your home screen.</p>
        </div>
        <button
          type="button"
          onClick={install}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
        <button type="button" aria-label="Hide" onClick={dismiss} className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      {helpDialog}
    </>
  )
}
