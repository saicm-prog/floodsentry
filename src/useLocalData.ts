import { useCallback, useEffect, useRef, useState } from 'react'

export function useLocalData<T>(endpoint: string, key: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  const refresh = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    try {
      const response = await fetch(endpoint, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()
      if (!Array.isArray(result[key])) throw new Error('Unexpected response')
      setData(result[key])
    } catch {
      if (!controller.signal.aborted) setError('We could not load these records. Check the local server, then try again.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [endpoint, key])
  useEffect(() => { void refresh(); return () => request.current?.abort() }, [refresh])
  return { data, loading, error, refresh }
}
