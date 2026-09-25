import { Button, Group, Input, NumberInput, SegmentedControl, Select, Stack, Switch, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Room, RoomRequest } from '@/api/generated'
import { ROOM_STATUS_OPTIONS } from './roomStatus'

const EMPTY: RoomRequest = { number: 0, name: '', floor: 1, capacity: 1, longTerm: false, status: 'AVAILABLE' }
const ONE_OR_TWO = ['1', '2']

export function RoomForm({ room, saving, onSubmit }: { room?: Room; saving: boolean; onSubmit: (data: RoomRequest) => void }) {
  const form = useForm<RoomRequest>({
    initialValues: room ?? EMPTY,
    validate: {
      number: (v) => (v >= 1 && v <= 999 ? null : 'Enter a room number'),
      name: (v) => (v.trim() ? null : 'Required'),
    },
  })

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Group grow align="flex-start">
          <NumberInput label="Room number" min={1} max={999} allowDecimal={false} data-autofocus {...form.getInputProps('number')} />
          <TextInput label="Room name" placeholder="e.g. MiniSingle" {...form.getInputProps('name')} />
        </Group>
        <Group grow>
          <Input.Wrapper label="Floor">
            <SegmentedControl fullWidth data={ONE_OR_TWO} value={String(form.values.floor)} onChange={(v) => form.setFieldValue('floor', Number(v))} />
          </Input.Wrapper>
          <Input.Wrapper label="Capacity (persons)">
            <SegmentedControl fullWidth data={ONE_OR_TWO} value={String(form.values.capacity)} onChange={(v) => form.setFieldValue('capacity', Number(v))} />
          </Input.Wrapper>
        </Group>
        <Select label="Status" data={ROOM_STATUS_OPTIONS} allowDeselect={false} {...form.getInputProps('status')} />
        <Switch label="Long-term rental" description="Rented monthly rather than per night" {...form.getInputProps('longTerm', { type: 'checkbox' })} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
