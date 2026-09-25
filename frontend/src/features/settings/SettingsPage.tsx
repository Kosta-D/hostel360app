import { Button, NumberInput, Paper, Stack, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getGetSettingsQueryKey, useGetSettings, useUpdateSettings, type Settings } from '@/api/generated'
import { money } from '@/shared/format'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'

export function SettingsPage() {
  const { data } = useGetSettings()
  const queryClient = useQueryClient()
  const form = useForm<Settings>({
    initialValues: { hostelName: '', eurToRsd: 0, bookingCommission: 15 },
    validate: {
      hostelName: (v) => (v.trim() ? null : 'Required'),
      eurToRsd: (v) => (v > 0 ? null : 'Must be greater than 0'),
    },
  })
  useEffect(() => { if (data) { form.setValues(data); form.resetDirty(data) } }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useUpdateSettings({
    mutation: {
      onSuccess: (saved) => { queryClient.setQueryData(getGetSettingsQueryKey(), saved); notify.ok('Settings saved') },
      onError: notify.error,
    },
  })

  return (
    <>
      <PageHeader title="Settings" />
      <Paper withBorder p="lg" maw={480}>
        <form onSubmit={form.onSubmit((values) => save.mutate({ data: values }))}>
          <Stack>
            <TextInput label="Hostel name" {...form.getInputProps('hostelName')} />
            <NumberInput
              label="Exchange rate: 1 EUR ="
              suffix=" RSD"
              min={0}
              decimalScale={4}
              description="Used when you enter amounts in RSD. Past records keep the rate they were saved with."
              {...form.getInputProps('eurToRsd')}
            />
            {form.values.eurToRsd > 0 && (
              <Text size="sm" c="dimmed">Example: {money(100)} = {money(100 * form.values.eurToRsd, 'RSD')}</Text>
            )}
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
    </>
  )
}
