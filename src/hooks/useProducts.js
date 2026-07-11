import { useEffect, useState } from 'react'
import { watchProducts } from '../services/productsRepository'

export function useProducts() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = watchProducts(
      (products) => {
        setData(products)
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
