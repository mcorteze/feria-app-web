import { useEffect, useState } from 'react'
import { watchList } from '../services/listsRepository'

export function useList(listId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!listId) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = watchList(
      listId,
      (list) => {
        setData(list)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [listId])

  return { data, loading, error }
}
