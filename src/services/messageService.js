import { STORAGE_KEYS } from '../lib/constants'
import { createId, readJson, wait, writeJson } from '../lib/storage'
import { supabase, unwrap } from './supabaseClient'

/**
 * Contact page messages. Supabase: public.contact_messages (admins read).
 * Demo mode: browser storage.
 */

const fromRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  phone: r.phone,
  message: r.message,
  read: r.is_read,
  createdAt: r.created_at,
})

/** Saves a message. Doesn't return the row: visitors aren't allowed to read messages back. */
export async function sendContactMessage({ name, phone, message }) {
  const row = { name: name.trim(), phone: phone || '', message: message.trim() }
  if (supabase) {
    unwrap(await supabase.from('contact_messages').insert(row))
    return
  }
  const list = readJson(STORAGE_KEYS.messages, [])
  writeJson(STORAGE_KEYS.messages, [
    { id: createId('msg_'), ...row, read: false, createdAt: new Date().toISOString() },
    ...list,
  ])
}

export async function listContactMessages() {
  if (supabase) {
    const rows = unwrap(
      await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(500),
    )
    return rows.map(fromRow)
  }
  await wait(150)
  return readJson(STORAGE_KEYS.messages, [])
}

export async function setMessageRead(id, read) {
  if (supabase) {
    unwrap(await supabase.from('contact_messages').update({ is_read: read }).eq('id', id))
    return
  }
  const list = readJson(STORAGE_KEYS.messages, [])
  writeJson(STORAGE_KEYS.messages, list.map((m) => (m.id === id ? { ...m, read } : m)))
}

export async function deleteContactMessage(id) {
  if (supabase) {
    unwrap(await supabase.from('contact_messages').delete().eq('id', id))
    return
  }
  const list = readJson(STORAGE_KEYS.messages, [])
  writeJson(STORAGE_KEYS.messages, list.filter((m) => m.id !== id))
}
