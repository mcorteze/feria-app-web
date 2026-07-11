import { useEffect, useState } from 'react'

const STORAGE_KEY = 'feria-app:displayName'

export function useProfileName(user) {
  const [name, setName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })

  useEffect(() => {
    if (!name && user?.displayName) {
      setName(user.displayName)
      localStorage.setItem(STORAGE_KEY, user.displayName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function saveName(value) {
    const trimmed = value.trim()
    setName(trimmed)
    localStorage.setItem(STORAGE_KEY, trimmed)
  }

  return { name, saveName }
}
