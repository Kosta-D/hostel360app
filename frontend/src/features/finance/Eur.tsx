import { Text } from '@mantine/core'
import { money } from '@/shared/format'
import { useDisplayCurrency } from '@/shared/useDisplayCurrency'

/** An EUR amount with its value in the display currency (at today's rate) underneath. */
export function Eur({ value, strong }: { value: number; strong?: boolean }) {
  const display = useDisplayCurrency()
  return (
    <div>
      <Text span fw={strong ? 700 : 500} style={{ whiteSpace: 'nowrap' }}>{money(value)}</Text>
      {display && value !== 0 && (
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{display.show(value)}</Text>
      )}
    </div>
  )
}
