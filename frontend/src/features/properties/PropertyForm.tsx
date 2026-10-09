import { Button, Group, Input, NumberInput, SegmentedControl, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { Property, PropertyRequest } from '@/api/generated'

const EMPTY: PropertyRequest = { name: '', type: 'APARTMENT', address: '', bookingCommission: 15, airbnbCommission: 3, guests: 2 }
const TYPES = [{ value: 'HOSTEL', label: 'Hostel (rooms)' }, { value: 'APARTMENT', label: 'Apartment (whole)' }]

export function PropertyForm({ property, saving, onSubmit }: { property?: Property; saving: boolean; onSubmit: (data: PropertyRequest) => void }) {
  const form = useForm<PropertyRequest>({
    initialValues: property ? { ...property, address: property.address ?? '', guests: property.guests ?? 2 } : EMPTY,
    validate: { name: (v) => (v.trim() ? null : 'Required') },
  })
  const apartment = form.values.type === 'APARTMENT'

  return (
    <form onSubmit={form.onSubmit((v) => onSubmit({ ...v, guests: apartment ? v.guests : null }))}>
      <Stack>
        <TextInput label="Name" placeholder="e.g. Sea View Apartment" data-autofocus {...form.getInputProps('name')} />
        <Input.Wrapper label="Type" description={property ? "Can't be changed after the property is added" : 'An apartment is rented as a whole, so it has no rooms'}>
          <SegmentedControl fullWidth mt={4} data={TYPES} disabled={!!property} value={form.values.type}
            onChange={(v) => form.setFieldValue('type', v as PropertyRequest['type'])} />
        </Input.Wrapper>
        {apartment && <NumberInput label="Guests" description="Most guests at once" min={1} max={10} allowDecimal={false} {...form.getInputProps('guests')} />}
        <TextInput label="Address" placeholder="Optional" {...form.getInputProps('address')} />
        <Group grow align="flex-start">
          <NumberInput label="Booking.com commission" suffix=" %" min={0} max={100} decimalScale={2} {...form.getInputProps('bookingCommission')} />
          <NumberInput label="Airbnb commission" suffix=" %" min={0} max={100} decimalScale={2} {...form.getInputProps('airbnbCommission')} />
        </Group>
        <Input.Description mt={-8}>Counted as a cost on every stay from that site. Past stays keep the rate they were saved with.</Input.Description>
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
