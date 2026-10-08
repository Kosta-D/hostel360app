import { Button, NumberInput, Paper, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getGetSettingsQueryKey, useGetSettings, useListCurrencies, useUpdateSettings, type Settings } from '@/api/generated'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'
import { CurrenciesCard } from './CurrenciesCard'

export function SettingsPage() {
  const { data } = useGetSettings()
  const { data: currencies = [] } = useListCurrencies()
  const queryClient = useQueryClient()
  const form = useForm<Settings>({
    initialValues: { hostelName: '', bookingCommission: 15, displayCurrency: null },
    validate: { hostelName: (v) => (v.trim() ? null : 'Required') },
  })
  useEffect(() => { if (data) { form.setValues(data); form.resetDirty(data) } }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useUpdateSettings({
    mutation: {
      onSuccess: (saved) => { queryClient.setQueryData(getGetSettingsQueryKey(), saved); notify.ok('Settings saved') },
      onError: notify.error,
    },
  })
  const displayOptions = currencies.filter((c) => c.active && c.code !== 'EUR').map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))

  return (
    <>
      <PageHeader title="Settings" />
      <Stack>
        <Paper withBorder p="lg" maw={640}>
          <form onSubmit={form.onSubmit((values) => save.mutate({ data: values }))}>
            <Stack>
              <TextInput label="Hostel name" {...form.getInputProps('hostelName')} />
              <Select
                label="Also show totals in"
                placeholder="EUR only"
                description="Totals are always in EUR; this adds the amount in a second currency underneath."
                data={displayOptions}
                clearable
                {...form.getInputProps('displayCurrency')}
              />
              <NumberInput
                label="Booking.com commission"
                suffix=" %"
                min={0}
                max={100}
                decimalScale={2}
                description="Counted as a cost on every Booking.com stay. Past stays keep the rate they were saved with."
                {...form.getInputProps('bookingCommission')}
              />
              <Button type="submit" loading={save.isPending} disabled={!form.isDirty()}>Save</Button>
            </Stack>
          </form>
        </Paper>
        <CurrenciesCard />
      </Stack>
    </>
  )
}
