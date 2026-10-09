import { Select, SegmentedControl, Text } from '@mantine/core'
import { useGetSettings } from '@/api/generated'
import { currencySlots } from './currencies'
import { money } from './format'

/** Picks one of the Settings currencies (plus the record's own one, if it is no longer among them). */
export function CurrencyPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { data: settings } = useGetSettings()
  const codes = currencySlots(settings).map((c) => c.code)
  if (value && !codes.includes(value)) codes.push(value)
  return codes.length <= 4
    ? <SegmentedControl fullWidth data={codes} value={value} onChange={onChange} />
    : <Select data={codes} value={value} onChange={(v) => v && onChange(v)} allowDeselect={false} />
}

/** "≈ 85,00 € at 1 EUR = 117.4 RSD" under an amount entered in a non-primary currency. */
export function PrimaryHint({ amount, currency }: { amount: number; currency: string }) {
  const { data: settings } = useGetSettings()
  const slot = currencySlots(settings).find((c) => c.code === currency)
  if (!settings || !slot || slot.rate === 1 || !(amount > 0)) return null
  return <Text size="xs" c="dimmed" mt={-8}>≈ {money(amount / slot.rate)} at 1 {settings.primaryCurrency} = {slot.rate} {currency}</Text>
}
