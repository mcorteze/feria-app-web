import { useEffect, useState } from 'react'
import { watchFrequentCollaborators } from '../services/frequentCollaboratorsRepository'

export function useFrequentCollaborators(uid) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = watchFrequentCollaborators(
      uid,
      (collaborators) => {
        setData(collaborators)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid])

  return { data, loading, error }
}
