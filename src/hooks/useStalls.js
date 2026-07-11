import { useEffect, useState } from 'react'
import { watchStalls } from '../services/stallsRepository'

export function useStalls() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = watchStalls(
      (stalls) => {
        setData(stalls)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  return { data, loading, error }
}
