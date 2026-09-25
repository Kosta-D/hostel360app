import { SimpleGrid } from '@mantine/core'
import { IconBed, IconBrush, IconCurrencyEuro, IconTool } from '@tabler/icons-react'
import { useGetSettings, useListRooms } from '@/api/generated'
import { PageHeader } from '@/shared/PageHeader'
import { StatCard } from '@/shared/StatCard'

export function DashboardPage() {
  const { data: rooms = [] } = useListRooms()
  const { data: settings } = useGetSettings()
  const count = (status: string) => rooms.filter((r) => r.status === status).length

  return (
    <>
      <PageHeader title="Dashboard" description="Today at a glance" />
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <StatCard label="Rooms" value={rooms.length} hint={`${count('AVAILABLE')} available`} icon={IconBed} />
        <StatCard label="Cleaning" value={count('CLEANING')} icon={IconBrush} />
        <StatCard label="Out of order" value={count('OUT_OF_ORDER')} icon={IconTool} />
        <StatCard label="EUR → RSD" value={settings?.eurToRsd ?? '—'} hint="Change in Settings" icon={IconCurrencyEuro} />
      </SimpleGrid>
    </>
  )
}
