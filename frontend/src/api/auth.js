const API_URL = (
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:4000/api`
).replace(/\/+$/, '')

async function submitAuthRequest(endpoint, credentials) {
  const response = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const payload = await response.json()

  if (!response.ok) {
    const message = payload.error?.message || 'The request could not be completed.'
    const details = payload.error?.details
    const detailMessages = details && typeof details === 'object'
      ? Object.entries(details)
        .flatMap(([field, messages]) =>
          Array.isArray(messages) ? messages.map((detail) => `${field}: ${detail}`) : [],
        )
        .join(' ')
      : ''

    throw new Error(detailMessages ? `${message}. ${detailMessages}` : message)
  }

  // A successful status alone isn't enough to start a valid session.
  if (!payload.data?.token || !payload.data?.user) {
    throw new Error('The server returned an invalid authentication response.')
  }

  return payload.data
}

export function login(credentials) {
  return submitAuthRequest('login', credentials)
}

export function register(credentials) {
  return submitAuthRequest('register', credentials)
}
