import { supabase, unwrap } from './supabaseClient'

/** Supabase Auth + public.profiles implementation used by authService.js. */

const fromProfile = (r) =>
  r && {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone,
    cnic: r.cnic || '',
    address: r.address,
    area: r.area,
    role: r.role,
    location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null,
    createdAt: r.created_at,
  }

const DUPLICATE_PHONE = 'This phone number is already registered with another account.'

/** Turns database/auth errors about duplicates into readable messages. */
function friendly(message = '') {
  if (/profiles_phone_unique|phone.*already (been )?registered|already registered.*phone/i.test(message)) return DUPLICATE_PHONE
  if (/profiles_cnic_unique|cnic.*already registered/i.test(message)) return 'This CNIC is already registered with another account.'
  if (/Database error saving new user/i.test(message)) return 'Could not create the account. This email, phone number or CNIC may already be registered.'
  return message
}

export async function getProfile(id) {
  return fromProfile(unwrap(await supabase.from('profiles').select('*').eq('id', id).maybeSingle()))
}

async function profileOrThrow(id) {
  const profile = await getProfile(id)
  if (!profile) throw new Error('Your profile is missing. Make sure the Supabase migration has been run.')
  return profile
}

export async function getSessionUser() {
  const { data } = await supabase.auth.getSession()
  return data.session ? getProfile(data.session.user.id) : null
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Supabase recommends not awaiting other supabase calls inside this callback.
    setTimeout(() => callback(event, session), 0)
  })
  return () => data.subscription.unsubscribe()
}

export async function checkSignupAvailable(email, phone, cnic) {
  let { data, error } = await supabase.rpc('check_signup_available', { p_email: email, p_phone: phone, p_cnic: cnic })
  // Until the CNIC migration is run only the email/phone version exists; until 20261022000000, neither does.
  if (error?.code === 'PGRST202') {
    ;({ data, error } = await supabase.rpc('check_signup_available', { p_email: email, p_phone: phone }))
    if (error?.code === 'PGRST202') return { email: true, phone: true, cnic: true }
  }
  if (error) throw new Error(error.message)
  return data
}

export async function register({ name, email, phone, cnic, area, address, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, cnic, area, address },
      emailRedirectTo: `${window.location.origin}/profile`,
    },
  })
  if (error) throw new Error(friendly(error.message))
  // With "Confirm email" enabled there is no session until the link is clicked.
  if (!data.session) return { pendingConfirmation: true, email: email.trim() }
  return profileOrThrow(data.user.id)
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) {
    throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message)
  }
  return profileOrThrow(data.user.id)
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function updateProfile(id, patch) {
  const update = {
    name: patch.name,
    address: String(patch.address ?? '').trim(),
    area: String(patch.area ?? '').trim(),
  }
  if (patch.phone !== undefined) update.phone = patch.phone
  if (patch.location !== undefined) {
    update.lat = patch.location?.lat ?? null
    update.lng = patch.location?.lng ?? null
  }
  let { data, error } = await supabase.from('profiles').update(update).eq('id', id).select().single()
  if (error?.code === 'PGRST204' && /'(lat|lng)'/.test(error.message)) {
    // Map pin columns arrive with migration 20261022000000; save everything else until then.
    delete update.lat
    delete update.lng
    ;({ data, error } = await supabase.from('profiles').update(update).eq('id', id).select().single())
  }
  if (error) throw new Error(friendly(error.message))
  return fromProfile(data)
}

export async function changePassword(email, currentPassword, newPassword) {
  if (String(newPassword || '').length < 6) throw new Error('Password must be at least 6 characters.')
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (check.error) throw new Error('Current password is incorrect.')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(error.message)
}

export async function setNewPassword(password) {
  if (String(password || '').length < 6) throw new Error('Password must be at least 6 characters.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}

export async function listUsers() {
  return unwrap(await supabase.from('profiles').select('*').order('created_at', { ascending: false })).map(fromProfile)
}

export async function setUserRole(id, role) {
  const row = unwrap(await supabase.from('profiles').update({ role }).eq('id', id).select().maybeSingle())
  if (!row) throw new Error('User not found, or you are not allowed to change roles.')
  if (row.role !== role) throw new Error('Only admins can change roles.')
}

export async function deleteUser(id) {
  unwrap(await supabase.rpc('admin_delete_user', { target: id }))
}
