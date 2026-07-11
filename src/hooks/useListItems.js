import { useEffect, useState } from 'react'
import { watchItems } from '../services/itemsRepository'

export function useListItems(listId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!listId) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = watchItems(
      listId,
      (items) => {
        setData(items)
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
