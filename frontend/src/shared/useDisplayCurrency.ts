import { useGetSettings, useListCurrencies } from '@/api/generated'
import { money } from './format'

/** The currency totals are also shown in (Settings), with its current rate; undefined for EUR only. */
export function useDisplayCurrency() {
  const { data: settings } = useGetSettings()
  const { data: currencies = [] } = useListCurrencies()
  const c = currencies.find((x) => x.code === settings?.displayCurrency)
  return c && { code: c.code, rate: c.rate, show: (eur: number) => money(eur * c.rate, c.code) }
}
