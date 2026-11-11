import { useCallback, useEffect, useState } from 'react'

/** Runs an async loader with loading / error / reload state. `deps` re-run it. */
export function useAsync(loader, deps, initial) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps)

  const reload = useCallback(() => {
    setLoading(true)
    setError('')
    return run()
      .then(setData)
      .catch((err) => setError(err.message || 'Something went wrong.'))
      .finally(() => setLoading(false))
  }, [run])

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    run()
      .then((value) => live && setData(value))
      .catch((err) => live && setError(err.message || 'Something went wrong.'))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [run])

  return { data, setData, loading, error, reload }
}
