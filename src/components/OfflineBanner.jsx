import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOnline } from '../hooks/useOnline'

/**
 * Products, stock and orders all come from the internet, so the store can't work offline.
 * This tells the customer clearly instead of leaving them with spinners or failed pages,
 * and says when the connection is back.
 */
export function OfflineBanner() {
  const online = useOnline()
  const wasOffline = useRef(!online)
  const [backOnline, setBackOnline] = useState(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      setBackOnline(false)
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    setBackOnline(true)
    const t = setTimeout(() => setBackOnline(false), 4000)
    return () => clearTimeout(t)
  }, [online])

  if (online && !backOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 md:bottom-6"
    >
      <div
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg ${
          online ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
        }`}
      >
        {online ? <Wifi className="h-5 w-5 shrink-0" /> : <WifiOff className="h-5 w-5 shrink-0" />}
        {online ? (
          <p className="font-medium">Wapas online — aap shopping jaari rakh sakte hain.</p>
        ) : (
          <div>
            <p className="font-semibold">Aap offline hain</p>
            <p className="text-xs text-slate-300">
              Internet on karein. Aap ka cart mehfooz hai — order internet aane par hi jayega.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
