import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ROLES, STORAGE_KEYS } from '../lib/constants'
import { readJson, removeKey, writeJson } from '../lib/storage'
import {
  changePassword as changePasswordRequest,
  ensureSeedAdmin,
  getUserById,
  loginUser,
  registerUser,
  updateUserProfile,
  usesSupabaseAuth,
} from '../services/authService'
import * as remote from '../services/authSupabase'

const AuthContext = createContext(null)

function readLocalSession() {
  const session = readJson(STORAGE_KEYS.user, null)
  // Sessions from the old device-only login have no userId; treat them as signed out.
  return session?.userId ? getUserById(session.userId) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (usesSupabaseAuth ? null : readLocalSession()))
  // With Supabase the session is restored asynchronously; guards wait for `ready`.
  const [ready, setReady] = useState(!usesSupabaseAuth)
  useEffect(() => {
    removeKey(STORAGE_KEYS.admin)
    if (usesSupabaseAuth) {
      let live = true
      remote
        .getSessionUser()
        .then((account) => live && setUser(account))
        .catch(() => live && setUser(null))
        .finally(() => live && setReady(true))
      const unsubscribe = remote.onAuthChange(async (event, session) => {
        if (!live || event === 'INITIAL_SESSION') return
        if (!session) {
          setUser(null)
          return
        }
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          const account = await remote.getProfile(session.user.id).catch(() => null)
          if (live && account) setUser(account)
        }
      })
      return () => {
        live = false
        unsubscribe()
      }
    }
    ensureSeedAdmin().catch(() => {})
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.user || e.key === STORAGE_KEYS.users) setUser(readLocalSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const startSession = useCallback((account) => {
    if (account?.pendingConfirmation) return account
    if (!usesSupabaseAuth) {
      writeJson(STORAGE_KEYS.user, { userId: account.id, loggedInAt: new Date().toISOString() })
    }
    setUser(account)
    return account
  }, [])

  const login = useCallback(async (credentials) => startSession(await loginUser(credentials)), [startSession])

  /** Resolves to the user, or to { pendingConfirmation, email } if Supabase needs email confirmation. */
  const register = useCallback(async (payload) => startSession(await registerUser(payload)), [startSession])

  const logout = useCallback(() => {
    if (usesSupabaseAuth) remote.logout().catch(() => {})
    else removeKey(STORAGE_KEYS.user)
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (patch) => {
      const next = await updateUserProfile(user.id, patch)
      setUser(next)
      return next
    },
    [user],
  )

  const changePassword = useCallback(
    (currentPassword, newPassword) => changePasswordRequest(user.id, currentPassword, newPassword, user.email),
    [user],
  )

  const refresh = useCallback(async () => {
    if (!usesSupabaseAuth) return setUser(readLocalSession())
    setUser(await remote.getSessionUser())
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === ROLES.admin,
      admin: user?.role === ROLES.admin ? user : null,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refresh,
    }),
    [user, ready, login, register, logout, updateProfile, changePassword, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
