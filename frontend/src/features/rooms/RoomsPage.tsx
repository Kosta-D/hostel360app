import { ActionIcon, Badge, Button, Drawer, Group, Skeleton, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getListRoomsQueryKey, useCreateRoom, useDeleteRoom, useListRooms, useUpdateRoom, type Room, type RoomRequest,
} from '@/api/generated'
import { money } from '@/shared/format'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'
import { RoomForm } from './RoomForm'
import { ROOM_STATUS } from './roomStatus'

export function RoomsPage() {
  const { data: rooms, isLoading } = useListRooms()
  const [editing, setEditing] = useState<Room | 'new' | null>(null)
  const queryClient = useQueryClient()

  const done = (message: string) => () => {
    queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() })
    setEditing(null)
    notify.ok(message)
  }
  const mutation = { onError: notify.error }
  const create = useCreateRoom({ mutation: { ...mutation, onSuccess: done('Room added') } })
  const update = useUpdateRoom({ mutation: { ...mutation, onSuccess: done('Room saved') } })
  const remove = useDeleteRoom({ mutation: { ...mutation, onSuccess: done('Room deleted') } })

  const save = (data: RoomRequest) =>
    editing === 'new' ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data })

  const confirmDelete = (room: Room) =>
    modals.openConfirmModal({
      title: `Delete room ${room.name}?`,
      children: <Text size="sm">This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ id: room.id }),
    })

  return (
    <>
      <PageHeader
        title="Rooms"
        description="Rooms you rent out, their price and housekeeping status"
        action={<Button leftSection={<IconPlus size={16} />} onClick={() => setEditing('new')}>Add room</Button>}
      />

      <Table.ScrollContainer minWidth={560}>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Room</Table.Th>
              <Table.Th>Capacity</Table.Th>
              <Table.Th>Price / night</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Notes</Table.Th>
              <Table.Th w={90} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading && <Table.Tr><Table.Td colSpan={6}><Skeleton h={24} /></Table.Td></Table.Tr>}
            {rooms?.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center" py="lg">No rooms yet. Add your first room.</Text></Table.Td></Table.Tr>
            )}
            {rooms?.map((room) => (
              <Table.Tr key={room.id}>
                <Table.Td fw={600}>{room.name}</Table.Td>
                <Table.Td>{room.capacity}</Table.Td>
                <Table.Td>{money(room.pricePerNight)}</Table.Td>
                <Table.Td><Badge variant="light" color={ROOM_STATUS[room.status].color}>{ROOM_STATUS[room.status].label}</Badge></Table.Td>
                <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{room.notes}</Text></Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon variant="subtle" aria-label="Edit" onClick={() => setEditing(room)}><IconPencil size={16} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" aria-label="Delete" onClick={() => confirmDelete(room)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

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
