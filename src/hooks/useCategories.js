import { useEffect, useState } from 'react'
import { watchCategories } from '../services/categoriesRepository'

export function useCategories() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = watchCategories(
      (categories) => {
        setData(categories)
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
