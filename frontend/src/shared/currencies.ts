import { useGetSettings, type Settings } from '@/api/generated'
import { money } from './format'

/** The up-to-three currencies from Settings with their rates (units per 1 primary), primary first. */
export const currencySlots = (s?: Settings) =>
  s ? [
    { code: s.primaryCurrency, rate: 1 },
    ...(s.secondCurrency && s.secondRate ? [{ code: s.secondCurrency, rate: s.secondRate }] : []),
    ...(s.thirdCurrency && s.thirdRate ? [{ code: s.thirdCurrency, rate: s.thirdRate }] : []),
  ] : []

/** The second currency from Settings, which totals are also shown in; undefined when there is none. */
export function useDisplayCurrency() {
  const { data: s } = useGetSettings()
  if (!s?.secondCurrency || !s.secondRate) return undefined
  const { secondCurrency: code, secondRate: rate } = s
  return { code, rate, show: (value: number) => money(value * rate, code) }
}
