import { useEffect, useState } from 'react'
import {
  watchCompletedListsForUser,
  watchListsForUser,
} from '../services/listsRepository'

export function useLists(uid, role) {
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
    const unsubscribe = watchListsForUser(
      uid,
      role,
      (lists) => {
        setData(lists)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [uid, role])

  return { data, loading, error }
}

export function useCompletedLists(uid) {
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
    const unsubscribe = watchCompletedListsForUser(
      uid,
      (lists) => {
        setData(lists)
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
