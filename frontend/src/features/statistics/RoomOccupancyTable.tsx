import { Paper, Table, Text, Tooltip } from '@mantine/core'
import dayjs from 'dayjs'
import type { StatsRoom } from '@/api/generated'
import { money } from '@/shared/format'

const MONTHS = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'))

/** Room × month grid shaded by occupancy (one blue, light to dark); long-term months are marked LT. */
function Cell({ occupied, longTerm }: { occupied: number; longTerm: boolean }) {
  const style = longTerm
    ? { background: 'var(--mantine-color-default-hover)' }
    : { background: `color-mix(in srgb, light-dark(#2a78d6, #3987e5) ${Math.round(occupied * 0.9)}%, transparent)`, color: occupied > 55 ? '#fff' : undefined }
  return (
    <Tooltip label={longTerm ? 'Long-term tenant' : `${occupied}% occupied`} withArrow>
      <Table.Td ta="center" fz="xs" style={style}>{longTerm ? 'LT' : occupied > 0 ? Math.round(occupied) : ''}</Table.Td>
    </Tooltip>
  )
}

export function RoomOccupancyTable({ rooms }: { rooms: StatsRoom[] }) {
  return (
    <Paper withBorder>
      <Table.ScrollContainer minWidth={900}>
        <Table verticalSpacing={6} horizontalSpacing={6}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Room</Table.Th>
              {MONTHS.map((m) => <Table.Th key={m} ta="center" fz="xs">{m}</Table.Th>)}
              <Table.Th ta="right">Nights</Table.Th>
              <Table.Th ta="right">Occupancy</Table.Th>
              <Table.Th ta="right">Income</Table.Th>
              <Table.Th ta="right">Per night</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rooms.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td style={{ whiteSpace: 'nowrap' }}><Text span fw={600}>{r.number}</Text> <Text span size="sm" c="dimmed">{r.name}</Text></Table.Td>
                {r.months.map((m, i) => <Cell key={i} {...m} />)}
                <Table.Td ta="right">{r.nightsSold}</Table.Td>
                <Table.Td ta="right">{r.occupancy}%</Table.Td>
                <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>{money(r.income)}</Table.Td>
                <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>{r.avgPrice ? money(r.avgPrice) : '–'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  )
}
