import { ActionIcon, Badge, Box, Button, Drawer, Group, Paper, SegmentedControl, Skeleton, Stack, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconPencil, IconPlus, IconTrash, IconUser, IconUsers } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getListRoomsQueryKey, useCreateRoom, useDeleteRoom, useListRooms, useUpdateRoom, useUpdateRoomStatus,
  type Room, type RoomRequest,
} from '@/api/generated'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'
import { RoomForm } from './RoomForm'
import { RoomStatusBadge } from './RoomStatusBadge'

const FLOORS = [{ label: 'All floors', value: 'all' }, { label: 'Floor 1', value: '1' }, { label: 'Floor 2', value: '2' }]
const TYPES = [{ label: 'All', value: 'all' }, { label: 'Short term', value: 'short' }, { label: 'Long term', value: 'long' }]

export function RoomsPage() {
  const { data: rooms, isLoading } = useListRooms()
  const [editing, setEditing] = useState<Room | 'new' | null>(null)
  const [floor, setFloor] = useState('all')
  const [type, setType] = useState('all')
  const queryClient = useQueryClient()

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() })
  const done = (message: string) => () => { refresh(); setEditing(null); notify.ok(message) }
  const onError = notify.error
  const create = useCreateRoom({ mutation: { onError, onSuccess: done('Room added') } })
  const update = useUpdateRoom({ mutation: { onError, onSuccess: done('Room saved') } })
  const remove = useDeleteRoom({ mutation: { onError, onSuccess: done('Room deleted') } })
  const setStatus = useUpdateRoomStatus({ mutation: { onError, onSuccess: refresh } })

  const save = (data: RoomRequest) =>
    editing === 'new' ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data })

  const confirmDelete = (room: Room) =>
    modals.openConfirmModal({
      title: `Delete room ${room.number} (${room.name})?`,
      children: <Text size="sm">This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ id: room.id }),
    })

  const actions = (room: Room) => (
    <Group gap={4} wrap="nowrap">
      <ActionIcon variant="subtle" aria-label="Edit" onClick={() => setEditing(room)}><IconPencil size={16} /></ActionIcon>
      <ActionIcon variant="subtle" color="red" aria-label="Delete" onClick={() => confirmDelete(room)}><IconTrash size={16} /></ActionIcon>
    </Group>
  )
  const status = (room: Room) => (
    <RoomStatusBadge status={room.status} onChange={(s) => setStatus.mutate({ id: room.id, data: { status: s } })} />
  )

  const visible = rooms?.filter((r) =>
    (floor === 'all' || r.floor === Number(floor)) && (type === 'all' || r.longTerm === (type === 'long')))

  return (
    <>
      <PageHeader
        title="Rooms"
        description="Click a status to change it"
        action={<Button leftSection={<IconPlus size={16} />} onClick={() => setEditing('new')}>Add room</Button>}
      />

      <Group mb="md" gap="sm">
        <SegmentedControl size="xs" data={FLOORS} value={floor} onChange={setFloor} />
        <SegmentedControl size="xs" data={TYPES} value={type} onChange={setType} />
      </Group>

      {/* Phones: one card per room */}
      <Stack hiddenFrom="sm" gap="xs">
        {isLoading && <Skeleton h={72} />}
        {visible?.length === 0 && <Text c="dimmed" ta="center" py="lg">No rooms match these filters.</Text>}
        {visible?.map((room) => (
          <Paper key={room.id} withBorder p="sm">
            <Group justify="space-between" wrap="nowrap">
              <Text fw={700} truncate>{room.number} · {room.name}</Text>
              {actions(room)}
            </Group>
            <Group gap="xs" mt={6}>
              {status(room)}
              <RentalBadge room={room} />
              <Text size="sm" c="dimmed">Floor {room.floor}</Text>
              <Capacity room={room} />
            </Group>
          </Paper>
        ))}
      </Stack>

      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={600}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={60}>No.</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Floor</Table.Th>
                <Table.Th>Capacity</Table.Th>
                <Table.Th>Rental</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={90} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading && <Table.Tr><Table.Td colSpan={7}><Skeleton h={24} /></Table.Td></Table.Tr>}
              {visible?.length === 0 && (
                <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center" py="lg">No rooms match these filters.</Text></Table.Td></Table.Tr>
              )}
              {visible?.map((room) => (
                <Table.Tr key={room.id}>
                  <Table.Td fw={700}>{room.number}</Table.Td>
                  <Table.Td>{room.name}</Table.Td>
                  <Table.Td>{room.floor}</Table.Td>
                  <Table.Td><Capacity room={room} /></Table.Td>
                  <Table.Td><RentalBadge room={room} /></Table.Td>
                  <Table.Td>{status(room)}</Table.Td>
                  <Table.Td>{actions(room)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      <Drawer opened={!!editing} onClose={() => setEditing(null)} position="right" title={editing === 'new' ? 'Add room' : 'Edit room'}>
        {editing && (
          <RoomForm
            key={editing === 'new' ? 'new' : editing.id}
            room={editing === 'new' ? undefined : editing}
            saving={create.isPending || update.isPending}
            onSubmit={save}
          />
        )}
      </Drawer>
    </>
  )
}

function RentalBadge({ room }: { room: Room }) {
  return <Badge variant="outline" color={room.longTerm ? 'grape' : 'gray'}>{room.longTerm ? 'Long term' : 'Short term'}</Badge>
}

function Capacity({ room }: { room: Room }) {
  return (
    <Group gap={4} wrap="nowrap" aria-label={`${room.capacity} person${room.capacity > 1 ? 's' : ''}`}>
      {room.capacity === 1 ? <IconUser size={16} /> : <IconUsers size={16} />}
      <Text size="sm">{room.capacity}</Text>
    </Group>
  )
}
