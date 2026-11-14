import { MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { PageHeader } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { sendContactMessage } from '../services/messageService'
import { CONTACT } from '../lib/constants'
import { cleanName, lettersOnly, nameError, normalizePhone, phoneError } from '../lib/validation'

export function ContactPage() {
  usePageSeo({
    title: 'Contact | AquaFizz',
    description: 'Call, WhatsApp or email AquaFizz support.',
  })
  const { user } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState(() => lettersOnly(user?.name || ''))
  const [phone, setPhone] = useState(() => normalizePhone(user?.phone || ''))
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Opens WhatsApp with the message ready to send to the store's number.
  const send = (e) => {
    e.preventDefault()
    const problem =
      nameError(name, 'Name') ||
      (phone ? phoneError(phone) : '') ||
      (message.trim().length < 5 ? 'Please write your message.' : '')
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    const details = [`Name: ${cleanName(name)}`, ...(phone ? [`Phone: ${phone}`] : [])]
    const text = ['Assalam o Alaikum AquaFizz,', '', message.trim(), '', ...details].join('\n')
    // Open WhatsApp first (browsers block pop-ups opened after an await), then keep a copy for admins.
    window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    sendContactMessage({ name: cleanName(name), phone, message })
      .then(() => {
        setMessage('')
        push('Message sent. Press send in WhatsApp too for a faster reply.')
      })
      .catch(() => {
        // WhatsApp still has the message; the saved copy is only a backup.
      })
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <PageHeader title="Contact" description="We reply during business hours." />
        <ul className="space-y-2 text-slate-600">
          <li>Phone: {CONTACT.phone}</li>
          <li>
            WhatsApp:{' '}
            <a className="font-medium text-primary-dark" href={`https://wa.me/${CONTACT.whatsapp}`}>
              Chat on WhatsApp
            </a>
          </li>
          <li>
            Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
          <li>Hours: {CONTACT.hours}</li>
          <li>Address: {CONTACT.address}</li>
        </ul>
      </div>
      <form noValidate className="grid gap-4 rounded-3xl border border-slate-100 p-5" onSubmit={send}>
        <div>
          <h2 className="text-lg font-semibold">Send us a message</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your message opens in WhatsApp, ready to send to our team.
          </p>
        </div>
        <Field id="c-name" label="Name">
          <input
            id="c-name"
            required
            autoComplete="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(lettersOnly(e.target.value))}
          />
        </Field>
        <Field id="c-phone" label="Mobile number (optional)" hint="So we can call you back if needed.">
          <input
            id="c-phone"
            type="tel"
            inputMode="numeric"
            maxLength={12}
            placeholder="03XXXXXXXXX"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
          />
        </Field>
        <Field id="c-message" label="Message">
          <textarea
            id="c-message"
            required
            rows={4}
            className={inputClass}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I want to order 10 cartons for an event"
          />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold"
        >
          <MessageCircle className="h-5 w-5" />
          Send on WhatsApp
        </button>
      </form>
    </div>
  )
}
