import { DEMO_ADMIN, ROLES, STORAGE_KEYS } from '../lib/constants'
import { createId, readJson, wait, writeJson } from '../lib/storage'
import { DISTRICTS } from '../lib/constants'
import { addressError, cleanName, cnicError, formatCnic, nameError, normalizePhone, phoneError } from '../lib/validation'
import * as remote from './authSupabase'
import { supabase } from './supabaseClient'

export const usesSupabaseAuth = Boolean(supabase)

/**
 * Local "users" table (stand-in for Supabase Auth + profiles).
 * Passwords are salted SHA-256 hashes — fine for a demo, NOT production security.
 */

async function hashPassword(password, salt) {
  if (!crypto?.subtle) throw new Error('Secure context required. Open the site over https or localhost.')
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function readUsers() {
  return readJson(STORAGE_KEYS.users, [])
}

function writeUsers(rows) {
  writeJson(STORAGE_KEYS.users, rows)
}

export function toPublicUser(row) {
  if (!row) return null
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, salt, ...rest } = row
  return rest
}

let seeding = null
export function ensureSeedAdmin() {
  if (supabase) return Promise.resolve()
  if (!seeding) {
    seeding = (async () => {
      const rows = readUsers()
      if (rows.some((u) => u.role === ROLES.admin)) return
      const salt = createId()
      rows.push({
        id: createId('u_'),
        name: DEMO_ADMIN.name,
        email: DEMO_ADMIN.email,
        phone: '',
        address: '',
        area: '',
        role: ROLES.admin,
        salt,
        passwordHash: await hashPassword(DEMO_ADMIN.password, salt),
        createdAt: new Date().toISOString(),
      })
      writeUsers(rows)
    })()
  }
  return seeding
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function assertPassword(password) {
  if (String(password || '').length < 6) throw new Error('Password must be at least 6 characters.')
}

export function getUserById(id) {
  return toPublicUser(readUsers().find((u) => u.id === id))
}

/** Validates signup fields and returns them cleaned. Throws the first problem found. */
export function validateSignup({ firstName, lastName, email, phone, cnic, area, address, password }) {
  const problem =
    nameError(firstName, 'First name') ||
    nameError(lastName, 'Last name') ||
    (!/^\S+@\S+\.\S+$/.test(normalizeEmail(email)) ? 'Please enter a valid email.' : '') ||
    phoneError(phone) ||
    cnicError(cnic) ||
    (!DISTRICTS.includes(area) ? 'Please choose your district.' : '') ||
    addressError(address)
  if (problem) throw new Error(problem)
  assertPassword(password)
  return {
    name: `${cleanName(firstName)} ${cleanName(lastName)}`,
    email: normalizeEmail(email),
    phone: normalizePhone(phone),
    cnic: formatCnic(cnic),
    area,
    address: String(address).trim().replace(/\s+/g, ' '),
    password,
  }
}

/** Throws if the email, phone or CNIC is already registered. */
export async function assertSignupAvailable({ email, phone, cnic }) {
  let free
  if (supabase) {
    free = await remote.checkSignupAvailable(email, phone, cnic)
  } else {
    await ensureSeedAdmin()
    const rows = readUsers()
    free = {
      email: !rows.some((u) => u.email === normalizeEmail(email)),
      phone: !rows.some((u) => u.phone && u.phone === normalizePhone(phone)),
      cnic: !rows.some((u) => u.cnic && u.cnic === formatCnic(cnic)),
    }
  }
  if (free.email === false) throw new Error('An account with this email already exists. Please log in instead.')
  if (free.phone === false) throw new Error('This phone number is already registered with another account.')
  if (free.cnic === false) throw new Error('This CNIC is already registered with another account.')
}

/** Returns the new user, or { pendingConfirmation, email } when Supabase requires email confirmation. */
export async function registerUser(input) {
  const clean = validateSignup(input)
  await assertSignupAvailable(clean)
  if (supabase) return remote.register(clean)
  await wait()
  const rows = readUsers()
  const salt = createId()
  const row = {
    id: createId('u_'),
    name: clean.name,
    email: clean.email,
    phone: clean.phone,
    cnic: clean.cnic,
    address: clean.address,
    area: clean.area,
    location: null,
    role: ROLES.user,
    salt,
    passwordHash: await hashPassword(clean.password, salt),
    createdAt: new Date().toISOString(),
  }
  writeUsers([...rows, row])
  return toPublicUser(row)
}

export async function loginUser({ email, password }) {
  if (supabase) return remote.login({ email, password })
  await ensureSeedAdmin()
  await wait()
  const row = readUsers().find((u) => u.email === normalizeEmail(email))
  if (!row || row.passwordHash !== (await hashPassword(password, row.salt))) {
    throw new Error('Incorrect email or password.')
  }
  return toPublicUser(row)
}

export async function updateUserProfile(id, patch) {
  const problem = nameError(patch.name, 'Name') || (patch.phone !== undefined ? phoneError(patch.phone) : '')
  if (problem) throw new Error(problem)
  const clean = {
    ...patch,
    name: cleanName(patch.name),
    ...(patch.phone !== undefined ? { phone: normalizePhone(patch.phone) } : {}),
  }
  if (supabase) return remote.updateProfile(id, clean)
  await wait(200)
  const rows = readUsers()
  const row = rows.find((u) => u.id === id)
  if (!row) throw new Error('Account not found.')
  if (clean.phone && rows.some((u) => u.id !== id && u.phone === clean.phone)) {
    throw new Error('This phone number is already registered with another account.')
  }
  const phone = clean.phone ?? row.phone
  const next = {
    ...row,
    name: clean.name,
    phone,
    address: String(clean.address ?? row.address).trim(),
    area: String(clean.area ?? row.area).trim(),
    location: clean.location === undefined ? row.location : clean.location,
  }
  writeUsers(rows.map((u) => (u.id === id ? next : u)))
  return toPublicUser(next)
}

export async function changePassword(id, currentPassword, newPassword, email) {
  if (supabase) return remote.changePassword(email, currentPassword, newPassword)
  await wait(200)
  const rows = readUsers()
  const row = rows.find((u) => u.id === id)
  if (!row) throw new Error('Account not found.')
  if (row.passwordHash !== (await hashPassword(currentPassword, row.salt))) {
    throw new Error('Current password is incorrect.')
  }
  assertPassword(newPassword)
  const salt = createId()
  const passwordHash = await hashPassword(newPassword, salt)
  writeUsers(rows.map((u) => (u.id === id ? { ...u, salt, passwordHash } : u)))
}

/**
 * Mock "email": returns the reset code so the UI can show it.
 * With Supabase this becomes supabase.auth.resetPasswordForEmail().
 */
export async function requestPasswordReset(email) {
  if (supabase) return remote.requestPasswordReset(email)
  await ensureSeedAdmin()
  await wait()
  const cleanEmail = normalizeEmail(email)
  const row = readUsers().find((u) => u.email === cleanEmail)
  if (!row) return null
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const resets = readJson(STORAGE_KEYS.resets, {})
  resets[cleanEmail] = { code, expiresAt: Date.now() + 15 * 60 * 1000 }
  writeJson(STORAGE_KEYS.resets, resets)
  return code
}

export async function resetPassword({ email, code, password }) {
  await wait()
  const cleanEmail = normalizeEmail(email)
  const resets = readJson(STORAGE_KEYS.resets, {})
  const entry = resets[cleanEmail]
  if (!entry || entry.code !== String(code).trim() || entry.expiresAt < Date.now()) {
    throw new Error('Reset code is invalid or has expired.')
  }
  assertPassword(password)
  const rows = readUsers()
  const salt = createId()
  const passwordHash = await hashPassword(password, salt)
  writeUsers(rows.map((u) => (u.email === cleanEmail ? { ...u, salt, passwordHash } : u)))
  delete resets[cleanEmail]
  writeJson(STORAGE_KEYS.resets, resets)
}

export async function listUsers() {
  if (supabase) return remote.listUsers()
  await ensureSeedAdmin()
  await wait()
  return readUsers().map(toPublicUser)
}

export async function setUserRole(id, role) {
  if (!Object.values(ROLES).includes(role)) throw new Error('Unknown role.')
  if (supabase) return remote.setUserRole(id, role)
  await wait(200)
  const rows = readUsers()
  const target = rows.find((u) => u.id === id)
  if (!target) throw new Error('User not found.')
  if (target.role === ROLES.admin && role !== ROLES.admin && rows.filter((u) => u.role === ROLES.admin).length <= 1) {
    throw new Error('At least one admin is required.')
  }
  writeUsers(rows.map((u) => (u.id === id ? { ...u, role } : u)))
}

export async function deleteUser(id) {
  if (supabase) return remote.deleteUser(id)
  await wait(200)
  const rows = readUsers()
  const target = rows.find((u) => u.id === id)
  if (!target) throw new Error('User not found.')
  if (target.role === ROLES.admin) throw new Error('Demote this admin before deleting the account.')
  writeUsers(rows.filter((u) => u.id !== id))
}
