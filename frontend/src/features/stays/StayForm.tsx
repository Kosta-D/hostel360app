import { Button, Checkbox, Group, Input, NumberInput, SegmentedControl, Select, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { DatePickerInput, MonthPickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import dayjs from 'dayjs'
import { useGetSettings, useListGuests, useListRooms, type Stay, type StayRequest } from '@/api/generated'
import { COUNTRIES } from '@/shared/countries'
import { ISO, addDays, diffDays } from '@/shared/dates'
import { money } from '@/shared/format'
import { PAYMENT, SOURCE, toOptions } from './stayLabels'

/** Values a new stay can start from (e.g. a room and day clicked in the calendar). */
export interface StayDefaults { roomId?: number; checkIn?: string }

type Values = {
  roomId: string | null
  guestId: string | null
  newGuest: boolean
  guestName: string
  guestCountry: string | null
  longTerm: boolean
  source: 'BOOKING' | 'DIRECT'
  dates: [string | null, string | null]
  fromMonth: string | null
  toMonth: string | null
  indefinite: boolean
  people: number
  amount: number | string
  currency: 'EUR' | 'RSD'
  paymentStatus: StayRequest['paymentStatus']
  note: string
}

const month = (d: string) => dayjs(d).startOf('month').format(ISO)

function initialValues(stay?: Stay, defaults: StayDefaults = {}): Values {
  if (!stay) {
    const checkIn = defaults.checkIn ?? null
    return {
      roomId: defaults.roomId ? String(defaults.roomId) : null, guestId: null, newGuest: false, guestName: '', guestCountry: null,
      longTerm: false, source: 'BOOKING', dates: [checkIn, checkIn ? addDays(checkIn, 1) : null],
      fromMonth: checkIn ? month(checkIn) : null, toMonth: null, indefinite: false,
      people: 1, amount: '', currency: 'EUR', paymentStatus: 'NOT_PAID', note: '',
    }
  }
  return {
    roomId: String(stay.room.id), guestId: String(stay.guest.id), newGuest: false, guestName: '', guestCountry: null,
    longTerm: stay.longTerm, source: stay.source ?? 'BOOKING', dates: [stay.checkIn, stay.checkOut ?? null],
    fromMonth: month(stay.checkIn), toMonth: stay.checkOut ? month(addDays(stay.checkOut, -1)) : null, indefinite: !stay.checkOut,
    people: stay.people, amount: stay.amount, currency: stay.currency, paymentStatus: stay.paymentStatus, note: stay.note ?? '',
  }
}

/** Long-term stays cover whole months: from the 1st of the first month to the 1st after the last month. */
function toRequest(v: Values): StayRequest {
  const [checkIn, checkOut] = v.longTerm
    ? [v.fromMonth!, v.indefinite || !v.toMonth ? undefined : dayjs(v.toMonth).add(1, 'month').format(ISO)]
    : [v.dates[0]!, v.dates[1]!]
  return {
    roomId: Number(v.roomId),
    ...(v.newGuest ? { guestName: v.guestName, guestCountry: v.guestCountry ?? undefined } : { guestId: Number(v.guestId) }),
    people: v.people, longTerm: v.longTerm, source: v.longTerm ? undefined : v.source,
    checkIn, checkOut, amount: Number(v.amount), currency: v.currency, paymentStatus: v.paymentStatus, note: v.note,
  }
}

interface Props { stay?: Stay; defaults?: StayDefaults; saving: boolean; onSubmit: (data: StayRequest) => void }

export function StayForm({ stay, defaults, saving, onSubmit }: Props) {
  const { data: rooms = [] } = useListRooms()
  const { data: guests = [] } = useListGuests()
  const { data: settings } = useGetSettings()

  const form = useForm<Values>({
    initialValues: initialValues(stay, defaults),
    validate: {
      roomId: (v) => (v ? null : 'Choose a room'),
      guestId: (v, all) => (all.newGuest || v ? null : 'Choose a guest'),
      guestName: (v, all) => (!all.newGuest || v.trim() ? null : 'Type the guest name'),
      dates: (v, all) => (all.longTerm || (v[0] && v[1]) ? null : 'Pick arrival and departure'),
      fromMonth: (v, all) => (!all.longTerm || v ? null : 'Pick the first month'),
      toMonth: (v, all) => (!all.longTerm || all.indefinite || (v && all.fromMonth && v >= all.fromMonth) ? null : 'Pick the last month or tick Indefinite'),
      amount: (v) => (v !== '' && Number(v) >= 0 ? null : 'Enter the amount'),
    },
  })
  const v = form.values
  const room = rooms.find((r) => String(r.id) === v.roomId)
  const nights = v.dates[0] && v.dates[1] ? diffDays(v.dates[0], v.dates[1]) : 0
  const pickRoom = (id: string | null) => {
    const r = rooms.find((x) => String(x.id) === id)
    form.setValues({ roomId: id, ...(r && !stay ? { longTerm: r.longTerm } : {}), ...(r && v.people > r.capacity ? { people: r.capacity } : {}) })
  }

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(toRequest(values)))}>
      <Stack>
        <Group align="flex-start" wrap="nowrap">
          <Select label="Room" searchable style={{ flex: 1 }} data={rooms.map((r) => ({ value: String(r.id), label: `${r.number} · ${r.name}` }))}
            {...form.getInputProps('roomId')} onChange={pickRoom} />
          <Input.Wrapper label="People">
            <SegmentedControl fullWidth size="md" value={String(v.people)} onChange={(x) => form.setFieldValue('people', Number(x))}
              data={[{ value: '1', label: '1' }, { value: '2', label: '2', disabled: room?.capacity === 1 }]} />
          </Input.Wrapper>
        </Group>

        {v.newGuest ? (
          <Group grow align="flex-start">
            <TextInput label="New guest name" data-autofocus {...form.getInputProps('guestName')} />
            <Select label="Country" searchable clearable data={COUNTRIES} {...form.getInputProps('guestCountry')} />
          </Group>
        ) : (
          <Select label="Guest" searchable nothingFoundMessage="No guest found, add a new one below"
            data={guests.map((g) => ({ value: String(g.id), label: g.country ? `${g.name} (${g.country})` : g.name }))}
            {...form.getInputProps('guestId')} />
        )}
        <Button variant="subtle" size="compact-sm" style={{ alignSelf: 'flex-start' }} onClick={() => form.setFieldValue('newGuest', !v.newGuest)}>
          {v.newGuest ? 'Pick an existing guest' : '+ New guest'}
        </Button>

        <Input.Wrapper label="Rental">
          <SegmentedControl fullWidth data={[{ value: 'short', label: 'Short term' }, { value: 'long', label: 'Long term' }]}
            value={v.longTerm ? 'long' : 'short'} onChange={(x) => form.setFieldValue('longTerm', x === 'long')} />
        </Input.Wrapper>

        {v.longTerm ? (
          <>
            <Group grow align="flex-start">
              <MonthPickerInput label="From month" {...form.getInputProps('fromMonth')} />
              <MonthPickerInput label="To month" disabled={v.indefinite} minDate={v.fromMonth ?? undefined} clearable {...form.getInputProps('toMonth')} />
            </Group>
            <Checkbox label="Indefinite (end not known yet)" {...form.getInputProps('indefinite', { type: 'checkbox' })} />
          </>
        ) : (
          <>
            <Input.Wrapper label="Booked via">
              <SegmentedControl fullWidth data={toOptions(SOURCE)} value={v.source} onChange={(x) => form.setFieldValue('source', x as Values['source'])} />
            </Input.Wrapper>
            <DatePickerInput type="range" label="Arrival → Departure" allowSingleDateInRange={false} numberOfColumns={1}
              valueFormat="D.M.YYYY" {...form.getInputProps('dates')}
              description={nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : undefined} />
          </>
        )}

        <Group grow align="flex-start">
          <NumberInput label={v.longTerm ? 'Monthly rent' : 'Total amount'} min={0} decimalScale={2} thousandSeparator="."
            decimalSeparator="," {...form.getInputProps('amount')} />
          <Input.Wrapper label="Currency">
            <SegmentedControl fullWidth data={['EUR', 'RSD']} value={v.currency} onChange={(x) => form.setFieldValue('currency', x as Values['currency'])} />
          </Input.Wrapper>
        </Group>
        {v.currency === 'RSD' && Number(v.amount) > 0 && settings && (
          <Text size="xs" c="dimmed" mt={-8}>≈ {money(Number(v.amount) / settings.eurToRsd)} at 1 EUR = {settings.eurToRsd} RSD</Text>
        )}

        <Input.Wrapper label="Paid">
          <SegmentedControl fullWidth data={toOptions(PAYMENT)} value={v.paymentStatus}
            onChange={(x) => form.setFieldValue('paymentStatus', x as Values['paymentStatus'])} />
        </Input.Wrapper>
        <Textarea label="Note" autosize minRows={2} {...form.getInputProps('note')} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
