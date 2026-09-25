import { SimpleGrid, Stack, Text } from '@mantine/core'
import { IconBed, IconBrush, IconCash, IconDoorEnter, IconDoorExit } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useFinanceYear, useListRooms, useListStays, type Stay } from '@/api/generated'
import { money } from '@/shared/format'
import { ISO, diffDays, today } from '@/shared/dates'
import { PageHeader } from '@/shared/PageHeader'
import { StatCard } from '@/shared/StatCard'
import { groupStays } from '@/features/stays/groupStays'
import { StayCard } from '@/features/stays/StayCard'
import { StayDrawer, type StayTarget } from '@/features/stays/StayDrawer'
import { useStayActions } from '@/features/stays/useStayActions'

const monthStart = dayjs().startOf('month').format(ISO)
const monthEnd = dayjs().add(1, 'month').startOf('month').format(ISO)

/** Short-stay nights that fall inside the current month. */
const nightsThisMonth = (stays: Stay[]) =>
  stays
    .filter((s) => !s.longTerm && s.checkOut && s.status !== 'CANCELLED')
    .reduce((sum, s) => sum + Math.max(0, diffDays(s.checkIn > monthStart ? s.checkIn : monthStart, s.checkOut! < monthEnd ? s.checkOut! : monthEnd)), 0)

export function DashboardPage() {
  const { data: rooms = [] } = useListRooms()
  const { data: stays = [] } = useListStays({ from: monthStart, to: dayjs().add(1, 'year').format(ISO) })
  const [target, setTarget] = useState<StayTarget>(null)
  const actions = useStayActions(() => setTarget(null))
  const t = today()
  const g = groupStays(stays, t)
  const taken = rooms.filter((r) => r.status === 'TAKEN').length
  const cleaning = rooms.filter((r) => r.status === 'NEEDS_CLEANING').length
  const todo = [...g.arriving, ...g.leaving]
  const { data: year } = useFinanceYear(dayjs().year())
  const month = year?.[dayjs().month()]

  return (
    <>
      <PageHeader title="Dashboard" description={dayjs().format('dddd, D MMMM YYYY')} />
      <SimpleGrid cols={{ base: 2, lg: 5 }} mb="xl">
        <StatCard label="Arriving today" value={g.arriving.filter((s) => s.checkIn === t).length} hint={g.arriving.length > 0 ? `${g.arriving.length} to check in` : undefined} icon={IconDoorEnter} />
        <StatCard label="Leaving today" value={g.leaving.length} icon={IconDoorExit} />
        <StatCard label="Occupancy" value={`${taken} / ${rooms.length}`} hint={`${nightsThisMonth(stays)} nights sold this month`} icon={IconBed} />
        <StatCard label="Needs cleaning" value={cleaning} icon={IconBrush} />
        <StatCard label="Profit this month" value={month ? money(month.profit) : '…'}
          hint={month ? `${money(month.income)} in · ${money(month.costs)} out` : undefined} icon={IconCash} />
      </SimpleGrid>

      <Text fw={600} mb="xs">To do today</Text>
      <Stack gap="xs">
        {todo.length === 0 && <Text size="sm" c="dimmed">No check-ins or check-outs waiting.</Text>}
        {todo.map((s) => <StayCard key={s.id} stay={s} actions={actions} onEdit={(stay) => setTarget({ stay })} />)}
      </Stack>
      <StayDrawer target={target} actions={actions} onClose={() => setTarget(null)} />
    </>
  )
}
