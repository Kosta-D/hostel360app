import { useQueryClient } from '@tanstack/react-query'

const PREFIXES = ['/api/finance', '/api/expenses', '/api/stays']

/** Reloads every finance view (and stays) after a change to expenses or payments. */
export function useFinanceRefresh() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      predicate: (q) => PREFIXES.some((p) => String(q.queryKey[0]).startsWith(p)),
    })
}
