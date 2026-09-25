import { Button, Group, Stack, Tabs, Text, TextInput } from '@mantine/core'
import { IconFileImport, IconPlus, IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import { useListStays, type Stay } from '@/api/generated'
import { PageHeader } from '@/shared/PageHeader'
import { BookingImportModal } from './BookingImportModal'
import { groupStays } from './groupStays'
import { StayCard } from './StayCard'
import { StayDrawer, type StayTarget } from './StayDrawer'
import { useStayActions } from './useStayActions'

export function StaysPage() {
  const { data: stays = [], isLoading } = useListStays()
  const [target, setTarget] = useState<StayTarget>(null)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const actions = useStayActions(() => setTarget(null))
  const g = groupStays(stays)
  const history = g.history.filter((s) => `${s.guest.name} ${s.room.number} ${s.room.name}`.toLowerCase().includes(search.toLowerCase()))

  const list = (items: Stay[], empty: string) =>
    items.length ? (
      <Stack gap="xs">{items.map((s) => <StayCard key={s.id} stay={s} actions={actions} onEdit={(stay) => setTarget({ stay })} />)}</Stack>
    ) : (
      <Text c="dimmed" size="sm" py="md">{isLoading ? 'Loading…' : empty}</Text>
    )
  const section = (title: string, items: Stay[], empty: string) => (
    <div>
      <Text fw={600} mb="xs">{title} <Text span c="dimmed">({items.length})</Text></Text>
      {list(items, empty)}
    </div>
  )

  return (
    <>
      <PageHeader
        title="Stays"
        description="Bookings, check-ins and check-outs"
        action={
          <Group gap="xs">
            <Button variant="default" leftSection={<IconFileImport size={16} />} onClick={() => setImporting(true)}>Import from Booking.com</Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => setTarget({ defaults: {} })}>New stay</Button>
          </Group>
        }
      />
      <Tabs defaultValue="today" keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="today">Today</Tabs.Tab>
          <Tabs.Tab value="upcoming">Upcoming ({g.upcoming.length})</Tabs.Tab>
          <Tabs.Tab value="history">History</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="today">
          <Stack gap="lg">
            {section('Arriving', g.arriving, 'No arrivals today.')}
            {section('Leaving', g.leaving, 'No departures today.')}
            {section('Staying', g.staying, 'Nobody is checked in.')}
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="upcoming">{list(g.upcoming, 'No upcoming bookings.')}</Tabs.Panel>
        <Tabs.Panel value="history">
          <TextInput mb="sm" placeholder="Search guest or room" leftSection={<IconSearch size={16} />} value={search}
            onChange={(e) => setSearch(e.currentTarget.value)} />
          {list(history, 'No past stays yet.')}
        </Tabs.Panel>
      </Tabs>
      <StayDrawer target={target} actions={actions} onClose={() => setTarget(null)} />
      <BookingImportModal opened={importing} onClose={() => setImporting(false)} />
    </>
  )
}
