import { Button, Drawer, Group, Paper, Select, Stack, Table, Text, TextInput, Textarea, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getListGuestsQueryKey, useCreateGuest, useDeleteGuest, useListGuests, useListStays, useUpdateGuest,
  type Guest, type GuestRequest,
} from '@/api/generated'
import { COUNTRIES } from '@/shared/countries'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'
import { StayCard } from '@/features/stays/StayCard'
import { StayDrawer, type StayTarget } from '@/features/stays/StayDrawer'
import { useStayActions } from '@/features/stays/useStayActions'

export function GuestsPage() {
  const [search, setSearch] = useState('')
  const [q] = useDebouncedValue(search, 250)
  const { data: guests = [], isLoading } = useListGuests(q ? { q } : undefined)
  const [editing, setEditing] = useState<Guest | 'new' | null>(null)
  const queryClient = useQueryClient()

  const done = (message: string) => () => {
    queryClient.invalidateQueries({ queryKey: [getListGuestsQueryKey()[0]] })
    setEditing(null)
    notify.ok(message)
  }
  const create = useCreateGuest({ mutation: { onSuccess: done('Guest added'), onError: notify.error } })
  const update = useUpdateGuest({ mutation: { onSuccess: done('Guest saved'), onError: notify.error } })
  const remove = useDeleteGuest({ mutation: { onSuccess: done('Guest deleted'), onError: notify.error } })

  const save = (data: GuestRequest) => (editing === 'new' ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data }))
  const guest = editing === 'new' ? undefined : editing ?? undefined

  return (
    <>
      <PageHeader title="Guests" description="Everyone who has stayed or booked"
        action={<Button leftSection={<IconPlus size={16} />} onClick={() => setEditing('new')}>Add guest</Button>} />
      <TextInput mb="md" maw={360} placeholder="Search by name" leftSection={<IconSearch size={16} />} value={search}
        onChange={(e) => setSearch(e.currentTarget.value)} />

      <Paper withBorder>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Country</Table.Th><Table.Th visibleFrom="sm">Note</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {!isLoading && guests.length === 0 && (
              <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center" py="md">{q ? 'No guest matches.' : 'No guests yet. They are added when you create a stay.'}</Text></Table.Td></Table.Tr>
            )}
            {guests.map((g) => (
              <Table.Tr key={g.id} onClick={() => setEditing(g)} style={{ cursor: 'pointer' }}>
                <Table.Td fw={600}>{g.name}</Table.Td>
                <Table.Td>{g.country}</Table.Td>
                <Table.Td visibleFrom="sm"><Text size="sm" c="dimmed" lineClamp={1}>{g.note}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Drawer opened={!!editing} onClose={() => setEditing(null)} position="right" size="md" title={guest ? guest.name : 'Add guest'}>
        {editing && (
          <Stack>
            <GuestForm key={guest?.id ?? 'new'} guest={guest} saving={create.isPending || update.isPending} onSubmit={save}
              onDelete={guest && (() => modals.openConfirmModal({
                title: `Delete ${guest.name}?`, labels: { confirm: 'Delete', cancel: 'Back' }, confirmProps: { color: 'red' },
                onConfirm: () => remove.mutate({ id: guest.id }),
              }))} />
            {guest && <GuestStays guestId={guest.id} />}
          </Stack>
        )}
      </Drawer>
    </>
  )
}

function GuestForm({ guest, saving, onSubmit, onDelete }: {
  guest?: Guest; saving: boolean; onSubmit: (data: GuestRequest) => void; onDelete?: () => void
}) {
  const form = useForm<GuestRequest>({
    initialValues: { name: guest?.name ?? '', country: guest?.country ?? '', note: guest?.note ?? '' },
    validate: { name: (v) => (v.trim() ? null : 'Required') },
  })
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Name" data-autofocus {...form.getInputProps('name')} />
        <Select label="Country" searchable clearable data={COUNTRIES} {...form.getInputProps('country')}
          onChange={(v) => form.setFieldValue('country', v ?? '')} />
        <Textarea label="Note" autosize minRows={2} {...form.getInputProps('note')} />
        <Group grow>
          {onDelete && <Button variant="light" color="red" onClick={onDelete}>Delete</Button>}
          <Button type="submit" loading={saving}>Save</Button>
        </Group>
      </Stack>
    </form>
  )
}

function GuestStays({ guestId }: { guestId: number }) {
  const { data: stays = [] } = useListStays({ guestId })
  const [target, setTarget] = useState<StayTarget>(null)
  const actions = useStayActions(() => setTarget(null))
  return (
    <>
      <Title order={5} mt="md">Stays ({stays.length})</Title>
      {stays.length === 0 && <Text size="sm" c="dimmed">No stays yet.</Text>}
      {[...stays].reverse().map((s) => <StayCard key={s.id} stay={s} actions={actions} onEdit={(stay) => setTarget({ stay })} />)}
      <StayDrawer target={target} actions={actions} onClose={() => setTarget(null)} />
    </>
  )
}
