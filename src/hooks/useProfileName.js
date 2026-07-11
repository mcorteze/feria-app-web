import { useEffect, useState } from 'react'

const STORAGE_KEY = 'feria-app:displayName'

export function useProfileName(user) {
  const [name, setName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || ''
  })

  useEffect(() => {
    if (!name && user?.displayName) {
      const initial = user.displayName.slice(0, 10)
      setName(initial)
      localStorage.setItem(STORAGE_KEY, initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function saveName(value) {
    const trimmed = value.slice(0, 10)
    setName(trimmed)
    localStorage.setItem(STORAGE_KEY, trimmed)
  }

  return { name, saveName }
}
