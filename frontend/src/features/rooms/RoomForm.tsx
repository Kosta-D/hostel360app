import { Button, Group, NumberInput, Select, Stack, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Room, RoomRequest } from '@/api/generated'
import { ROOM_STATUS_OPTIONS } from './roomStatus'

const EMPTY: RoomRequest = { name: '', capacity: 2, pricePerNight: 0, status: 'AVAILABLE', notes: '' }

export function RoomForm({ room, saving, onSubmit }: { room?: Room; saving: boolean; onSubmit: (data: RoomRequest) => void }) {
  const form = useForm<RoomRequest>({
    initialValues: room ? { ...EMPTY, ...room, notes: room.notes ?? '' } : EMPTY,
    validate: {
      name: (v) => (v.trim() ? null : 'Required'),
      capacity: (v) => (v >= 1 ? null : 'At least 1'),
      pricePerNight: (v) => (v >= 0 ? null : 'Cannot be negative'),
    },
  })

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Name / number" placeholder="e.g. 101" data-autofocus {...form.getInputProps('name')} />
        <Group grow>
          <NumberInput label="Capacity" min={1} max={50} {...form.getInputProps('capacity')} />
          <NumberInput label="Price per night" suffix=" €" min={0} decimalScale={2} {...form.getInputProps('pricePerNight')} />
        </Group>
        <Select label="Status" data={ROOM_STATUS_OPTIONS} allowDeselect={false} {...form.getInputProps('status')} />
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
