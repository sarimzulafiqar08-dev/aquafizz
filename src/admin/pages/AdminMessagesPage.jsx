import { MessageCircle, Phone, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/Feedback'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { usePageSeo } from '../../hooks/usePageSeo'
import { deleteContactMessage, listContactMessages, setMessageRead } from '../../services/messageService'

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
]

/** 03001234567 → 923001234567 for wa.me links. */
const waNumber = (phone) => `92${phone.slice(1)}`

export function AdminMessagesPage() {
  usePageSeo({ title: 'Admin messages | AquaFizz' })
  const { push } = useToast()
  const { confirm } = useConfirm()
  const { data: messages, setData, loading, error, reload } = useAsync(listContactMessages, [], [])
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState('')

  const unread = messages.filter((m) => !m.read).length
  const visible = messages.filter((m) => !filter || (filter === 'read' ? m.read : !m.read))

  const run = async (id, fn, apply, message) => {
    setBusyId(id)
    try {
      await fn()
      setData(apply)
      if (message) push(message)
    } catch (err) {
      push(err.message, 'error')
    } finally {
      setBusyId('')
    }
  }

  const toggleRead = (m) =>
    run(m.id, () => setMessageRead(m.id, !m.read), (list) => list.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x)))

  const remove = async (m) => {
    const ok = await confirm({
      title: 'Delete message?',
      message: `Message from ${m.name} will be removed.`,
      confirmLabel: 'Delete',
    })
    if (ok) run(m.id, () => deleteContactMessage(m.id), (list) => list.filter((x) => x.id !== m.id), 'Message deleted')
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description={`From the Contact page. ${unread} unread of ${messages.length}.`}
      />
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-medium ${
              filter === f.id ? 'bg-primary text-black' : 'border border-slate-200 bg-white text-slate-600'
            }`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === 'unread' && unread ? ` (${unread})` : ''}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={
            /contact_messages/.test(error)
              ? 'The messages table is missing. Run supabase/migrations/20261114000000_contact_messages.sql in the Supabase SQL Editor.'
              : error
          }
          onRetry={reload}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={messages.length ? 'No messages here' : 'No messages yet'}
          description="Messages sent from the Contact page show up here."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((m) => (
            <li
              key={m.id}
              className={`rounded-3xl border bg-white p-4 ${m.read ? 'border-slate-100' : 'border-primary/60'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {!m.read ? <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-label="Unread" /> : null}
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}
                    {m.phone ? ` · ${m.phone}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {busyId === m.id ? <Spinner className="h-4 w-4 text-primary" /> : null}
                  {m.phone ? (
                    <>
                      <a
                        href={`https://wa.me/${waNumber(m.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${m.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-emerald-600 hover:bg-emerald-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <a
                        href={`tel:${m.phone}`}
                        aria-label={`Call ${m.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-50"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    </>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium"
                    onClick={() => toggleRead(m)}
                  >
                    {m.read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    aria-label={`Delete message from ${m.name}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-red-600 hover:bg-red-50"
                    onClick={() => remove(m)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-slate-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
