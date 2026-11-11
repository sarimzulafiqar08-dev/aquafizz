import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { PageHeader } from '../components/Feedback'
import { useToast } from '../context/ToastContext'
import { usePageSeo } from '../hooks/usePageSeo'
import { CONTACT } from '../lib/constants'

export function ContactPage() {
  usePageSeo({
    title: 'Contact | AquaFizz',
    description: 'Call, WhatsApp or email AquaFizz support.',
  })
  const { push } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

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
      <form
        className="grid gap-4 rounded-3xl border border-slate-100 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          push('Message saved. We will connect this form to support next.')
          setName('')
          setEmail('')
          setMessage('')
        }}
      >
        <Field id="c-name" label="Name">
          <input id="c-name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="c-email" label="Email">
          <input
            id="c-email"
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          />
        </Field>
        <button type="submit" className="rounded-full bg-primary py-3 font-semibold">
          Send message
        </button>
      </form>
    </div>
  )
}
