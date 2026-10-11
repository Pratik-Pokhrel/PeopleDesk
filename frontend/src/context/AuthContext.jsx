import { useState } from 'react'
import AuthContext from './auth-context.js'
import { login as loginRequest, register as registerRequest } from '../services/auth.js'

const AUTH_STORAGE_KEY = 'peopledesk.auth'

function readStoredSession() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedSession) return null

  let session
  try {
    session = JSON.parse(storedSession)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }

  if (
    typeof session?.token !== 'string' ||
    !session.user ||
    typeof session.user !== 'object'
  ) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }

  return session
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  async function authenticate(request) {
    const result = await request()
    const nextSession = { token: result.token, user: result.user }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  async function createAccount(credentials) {
    return registerRequest(credentials)
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setSession(null)
  }

  const value = {
    token: session?.token ?? null,
    user: session?.user ?? null,
    login: (credentials) => authenticate(() => loginRequest(credentials)),
    register: createAccount,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}