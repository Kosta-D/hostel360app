import { Button, Group, NumberInput, Select, Stack, Switch, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Property, Room, RoomRequest } from '@/api/generated'
import { ROOM_STATUS_OPTIONS } from './roomStatus'

interface Props { room?: Room; hostels: Property[]; hostelId: number; saving: boolean; onSubmit: (data: RoomRequest) => void }

export function RoomForm({ room, hostels, hostelId, saving, onSubmit }: Props) {
  const form = useForm<RoomRequest>({
    initialValues: room
      ? { ...room, floor: room.floor ?? 1, bookingType: room.bookingType ?? '' }
      : { propertyId: hostelId, number: 0, name: '', floor: 1, capacity: 1, longTerm: false, status: 'AVAILABLE', bookingType: '' },
    validate: {
      number: (v) => (v >= 1 && v <= 999 ? null : 'Enter a room number'),
      name: (v) => (v.trim() ? null : 'Required'),
    },
  })

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {hostels.length > 1 && (
          <Select label="Hostel" allowDeselect={false} data={hostels.map((p) => ({ value: String(p.id), label: p.name }))}
            value={String(form.values.propertyId)} onChange={(v) => form.setFieldValue('propertyId', Number(v))} />
        )}
        <Group grow align="flex-start">
          <NumberInput label="Room number" min={1} max={999} allowDecimal={false} data-autofocus {...form.getInputProps('number')} />
          <TextInput label="Room name" placeholder="e.g. MiniSingle" {...form.getInputProps('name')} />
        </Group>
        <Group grow align="flex-start">
          <NumberInput label="Floor" min={-5} max={200} allowDecimal={false} {...form.getInputProps('floor')} />
          <NumberInput label="Capacity (persons)" min={1} max={10} allowDecimal={false} {...form.getInputProps('capacity')} />
        </Group>
        <Select label="Status" data={ROOM_STATUS_OPTIONS} allowDeselect={false} {...form.getInputProps('status')} />
        <Switch label="Long-term rental" description="Rented monthly rather than per night" {...form.getInputProps('longTerm', { type: 'checkbox' })} />
        <TextInput label="Booking.com room type" description="Exactly as in the extranet export; used when importing reservations"
          placeholder="e.g. Double or Twin Room with Shared Bathroom" {...form.getInputProps('bookingType')} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
