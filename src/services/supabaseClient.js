import { createClient } from '@supabase/supabase-js'

/**
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to switch the app
 * from browser storage (demo mode) to Supabase. Run supabase/migrations first.
 */
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export function getSupabaseClient() {
  return supabase
}

export const PRODUCT_IMAGES_BUCKET = 'product-images'

/** Throws a readable Error for a Supabase { error } result. */
export function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Something went wrong. Please try again.')
  return data
}
