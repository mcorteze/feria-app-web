import { useEffect, useState } from 'react'
import { consumeRedirectResult, watchAuthState } from '../services/authRepository'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    consumeRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          setAuthError(`OK redirect: ${redirectUser.uid}`)
        }
      })
      .catch((err) => {
        setAuthError(`Redirect error: ${err?.code || 'sin código'} — ${err?.message || err}`)
      })
    const unsubscribe = watchAuthState((firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading, authError }
}
