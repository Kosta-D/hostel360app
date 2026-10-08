import { Select, SegmentedControl, Text } from '@mantine/core'
import { useListCurrencies } from '@/api/generated'
import { money } from './format'

/** Picks one of the active currencies (plus the record's own one, even if it was switched off). */
export function CurrencyPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { data: currencies = [] } = useListCurrencies()
  const codes = currencies.filter((c) => c.active || c.code === value).map((c) => c.code)
  if (!codes.includes(value)) codes.push(value)
  return codes.length <= 4
    ? <SegmentedControl fullWidth data={codes} value={value} onChange={onChange} />
    : <Select data={codes} value={value} onChange={(v) => v && onChange(v)} allowDeselect={false} searchable />
}

/** "≈ €85 at 1 EUR = 117.4 RSD" under an amount entered in another currency. */
export function EurHint({ amount, currency }: { amount: number; currency: string }) {
  const { data: currencies = [] } = useListCurrencies()
  const rate = currencies.find((c) => c.code === currency)?.rate
  if (currency === 'EUR' || !rate || !(amount > 0)) return null
  return <Text size="xs" c="dimmed" mt={-8}>≈ {money(amount / rate)} at 1 EUR = {rate} {currency}</Text>
}
