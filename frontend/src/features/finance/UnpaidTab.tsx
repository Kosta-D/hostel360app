import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import { useListUnpaid, useMarkPaid, useSetRentPaid, type UnpaidItem } from '@/api/generated'
import { fmtDate, fmtMonth } from '@/shared/dates'
import { money } from '@/shared/format'
import { notify } from '@/shared/notify'
import { useFinanceRefresh } from './useFinanceRefresh'

/** Who still owes money: short stays not fully paid, and each unpaid month of long-term rent. */
export function UnpaidTab() {
  const { data: items = [], isLoading } = useListUnpaid()
  const refresh = useFinanceRefresh()
  const opts = { mutation: { onSuccess: () => { refresh(); notify.ok('Marked as paid') }, onError: notify.error } }
  const markStay = useMarkPaid(opts)
  const markRent = useSetRentPaid(opts)
  const total = items.reduce((sum, i) => sum + i.amountEur, 0)

  const pay = (i: UnpaidItem) =>
    i.month ? markRent.mutate({ data: { stayId: i.stayId, month: i.month, paid: true } }) : markStay.mutate({ id: i.stayId })

  if (!items.length) return <Text c="dimmed" size="sm" py="md">{isLoading ? 'Loading…' : 'Everyone has paid.'}</Text>
  return (
    <>
      <Text fw={600} mb="sm">Owed: {money(total)} <Text span c="dimmed">({items.length})</Text></Text>
      <Stack gap="xs">
        {items.map((i) => (
          <Paper key={`${i.stayId}-${i.month ?? ''}`} withBorder p="sm">
            <Group justify="space-between" wrap="nowrap" align="center">
              <div style={{ minWidth: 0 }}>
                <Text fw={600} truncate>{i.guestName}</Text>
                <Text size="sm" c="dimmed">
                  Room {i.roomNumber} · {i.month ? `Rent for ${fmtMonth(i.month)}` : `${fmtDate(i.checkIn)} → ${i.checkOut ? fmtDate(i.checkOut) : ''}`}
                </Text>
                <Group gap={6} mt={4}>
                  <Text size="sm" fw={500}>{money(i.amount, i.currency)}</Text>
                  {i.paymentStatus === 'PARTLY_PAID' && <Badge size="sm" color="yellow" variant="light">Partly paid</Badge>}
                </Group>
              </div>
              <Button size="xs" variant="light" leftSection={<IconCheck size={14} />} onClick={() => pay(i)}>Mark paid</Button>
            </Group>
          </Paper>
        ))}
      </Stack>
    </>
  )
}
