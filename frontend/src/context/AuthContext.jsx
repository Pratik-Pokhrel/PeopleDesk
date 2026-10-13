import { useState, useEffect } from 'react'
import AuthContext from './auth-context.js'
import { login as loginRequest, register as registerRequest } from '../api/auth.js'

const AUTH_STORAGE_KEY = 'peopledesk.auth'

// Reads and validates the persisted authentication session from browser local storage
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

// React context provider that encapsulates authentication state and exposes auth action handlers to child components
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession)

  // Subscribes to custom session expiration events dispatched by API clients to clear invalid authentication tokens
  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setSession(null)
    }
    // API requests dispatch this event when the saved token is no longer valid.
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

// Executes an authentication request, persists the returned token and user session to local storage, and updates React state
  async function authenticate(request) {
    const result = await request()
    const nextSession = { token: result.token, user: result.user }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  // Delegates account creation credentials to the registration API service module
  async function createAccount(credentials) {
    return registerRequest(credentials)
  }

  // Purges the persisted authentication payload from local storage and resets the current session state to unauthenticated
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