import { SimpleGrid } from '@mantine/core'
import { IconBed, IconBrush, IconDoorEnter, IconKey } from '@tabler/icons-react'
import { RoomStatus, useListRooms } from '@/api/generated'
import { PageHeader } from '@/shared/PageHeader'
import { StatCard } from '@/shared/StatCard'

export function DashboardPage() {
  const { data: rooms = [] } = useListRooms()
  const count = (status: RoomStatus) => rooms.filter((r) => r.status === status).length
  const longTerm = rooms.filter((r) => r.longTerm).length

  return (
    <>
      <PageHeader title="Dashboard" description="Today at a glance" />
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <StatCard label="Available" value={count(RoomStatus.AVAILABLE)} hint="Ready to book" icon={IconDoorEnter} />
        <StatCard label="Taken" value={count(RoomStatus.TAKEN)} hint="Guests staying now" icon={IconKey} />
        <StatCard label="Needs cleaning" value={count(RoomStatus.NEEDS_CLEANING)} icon={IconBrush} />
        <StatCard label="Rooms" value={rooms.length} hint={`${longTerm} long term, ${rooms.length - longTerm} short term`} icon={IconBed} />
      </SimpleGrid>
    </>
  )
}
