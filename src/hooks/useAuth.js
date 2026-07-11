import { useEffect, useState } from 'react'
import { consumeRedirectResult, watchAuthState } from '../services/authRepository'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    consumeRedirectResult().catch((err) => {
      setAuthError(`Redirect: ${err?.code || 'error'} — ${err?.message || err}`)
    })
    const unsubscribe = watchAuthState((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading, authError }
}
