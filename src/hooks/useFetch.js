import { useState, useEffect, useRef } from 'react'

export function useFetch(fetchFn, fallback) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const fetchFnRef = useRef(fetchFn)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchFnRef.current()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('API fetch failed, using fallback data:', err.message)
          setError(err.message)
          if (fallback !== undefined) setData(fallback)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function refresh() {
    setRefreshKey(k => k + 1)
  }

  return { data, loading, error, refresh }
}
