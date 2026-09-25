import { Text } from '@mantine/core'
import { useGetSettings } from '@/api/generated'
import { money } from '@/shared/format'

/** An EUR amount with its RSD value (at today's rate) underneath. */
export function Eur({ value, strong }: { value: number; strong?: boolean }) {
  const { data: settings } = useGetSettings()
  return (
    <div>
      <Text span fw={strong ? 700 : 500} style={{ whiteSpace: 'nowrap' }}>{money(value)}</Text>
      {settings && value !== 0 && (
        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{money(value * settings.eurToRsd, 'RSD')}</Text>
      )}
    </div>
  )
}
