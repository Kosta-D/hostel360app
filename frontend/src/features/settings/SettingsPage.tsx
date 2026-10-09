import { Button, Divider, Group, NumberInput, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getGetSettingsQueryKey, useGetSettings, useMakePrimary, useUpdateSettings, type Settings } from '@/api/generated'
import { money, setPrimaryCurrency } from '@/shared/format'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'

type Values = {
  hostelName: string
  secondCurrency: string
  secondRate: number | string
  thirdCurrency: string
  thirdRate: number | string
}
type Slot = 'second' | 'third'

const toValues = (s: Settings): Values => ({
  hostelName: s.hostelName,
  secondCurrency: s.secondCurrency ?? '', secondRate: s.secondRate ?? '',
  thirdCurrency: s.thirdCurrency ?? '', thirdRate: s.thirdRate ?? '',
})

const code = (v: string) => v.trim().toUpperCase()

export function SettingsPage() {
  const { data } = useGetSettings()
  const queryClient = useQueryClient()
  const primary = data?.primaryCurrency ?? 'EUR'
  const slotRules = (slot: Slot) => ({
    [`${slot}Currency`]: (v: string, all: Values) => {
      const c = code(v)
      if (!c) return null
      if (!/^[A-Z]{3}$/.test(c)) return '3 letters, like USD'
      if (c === primary) return 'Already the primary currency'
      if (slot === 'third' && c === code(all.secondCurrency)) return 'Same as the second currency'
      return null
    },
    [`${slot}Rate`]: (v: number | string, all: Values) =>
      code(all[`${slot}Currency`]) && !(Number(v) > 0) ? 'Enter the rate' : null,
  })
  const form = useForm<Values>({
    initialValues: { hostelName: '', secondCurrency: '', secondRate: '', thirdCurrency: '', thirdRate: '' },
    validate: { hostelName: (v) => (v.trim() ? null : 'Required'), ...slotRules('second'), ...slotRules('third') },
  })
  useEffect(() => { if (data) { const v = toValues(data); form.setValues(v); form.resetDirty(v) } }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const saved = (s: Settings) => queryClient.setQueryData(getGetSettingsQueryKey(), s)
  const save = useUpdateSettings({ mutation: { onSuccess: (s) => { saved(s); notify.ok('Settings saved') }, onError: notify.error } })
  const makePrimary = useMakePrimary({
    mutation: {
      onSuccess: (s) => {
        setPrimaryCurrency(s.primaryCurrency)
        saved(s)
        queryClient.invalidateQueries()
        notify.ok(`${s.primaryCurrency} is now the primary currency`)
      },
      onError: notify.error,
    },
  })

  const submit = (v: Values) => {
    const slot = (c: string, r: number | string) => (code(c) ? { currency: code(c), rate: Number(r) } : { currency: null, rate: null })
    const second = slot(v.secondCurrency, v.secondRate)
    const third = slot(v.thirdCurrency, v.thirdRate)
    save.mutate({
      data: {
        hostelName: v.hostelName, primaryCurrency: primary,
        secondCurrency: second.currency, secondRate: second.rate, thirdCurrency: third.currency, thirdRate: third.rate,
      },
    })
  }

  const confirmPrimary = (slot: Slot) => {
    const c = data?.[`${slot}Currency`]
    const rate = data?.[`${slot}Rate`]
    if (!c || !rate) return
    modals.openConfirmModal({
      title: `Make ${c} the primary currency?`,
      children: (
        <Text size="sm">
          All totals in Finance and Statistics, past months included, will be shown in {c}. Amounts entered in {c} stay
          exact; the others are converted at 1 {primary} = {rate} {c}. {primary} becomes the {slot} currency, and you can
          switch back at any time.
        </Text>
      ),
      labels: { confirm: `Make ${c} primary`, cancel: 'Cancel' },
      onConfirm: () => makePrimary.mutate({ data: { code: c } }),
    })
  }

  const slotRow = (slot: Slot, label: string, placeholder: string) => {
    const c = code(form.values[`${slot}Currency`])
    const rate = Number(form.values[`${slot}Rate`])
    const canPromote = !form.isDirty() && !!data?.[`${slot}Currency`]
    return (
      <div>
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <TextInput label={label} placeholder={placeholder} maxLength={3} w={110} {...form.getInputProps(`${slot}Currency`)} />
          <NumberInput label={`1 ${primary} =`} suffix={c ? ` ${c}` : undefined} min={0} decimalScale={10} disabled={!c}
            style={{ flex: 1 }} {...form.getInputProps(`${slot}Rate`)} />
        </Group>
        <Group justify="space-between" mt={4} mih={28}>
          <Text size="xs" c="dimmed">
            {/^[A-Z]{3}$/.test(c) && rate > 0 ? `Example: ${money(100, primary)} = ${money(100 * rate, c)}` : 'Optional'}
          </Text>
          {canPromote && (
            <Button size="compact-xs" variant="subtle" onClick={() => confirmPrimary(slot)} loading={makePrimary.isPending}>
              Make primary
            </Button>
          )}
        </Group>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Settings" />
      <Paper withBorder p="lg" maw={560}>
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            <TextInput label="App name" description="Shown at the top of every page. Commissions are set per property on the Properties page."
              {...form.getInputProps('hostelName')} />

            <Divider mt="xs" />
            <div>
              <Title order={5}>Currencies</Title>
              <Text size="sm" c="dimmed">
                Up to three. All totals are in the primary currency, with the second one shown underneath. Changing a
                rate only affects new amounts; past stays and expenses keep the rate they were saved with.
              </Text>
            </div>
            <Group gap="xs">
              <Text size="sm" fw={600}>Primary</Text>
              <Text size="sm" fw={700}>{primary}</Text>
            </Group>
            {slotRow('second', 'Second', 'RSD')}
            {slotRow('third', 'Third', 'USD')}

            <Button type="submit" loading={save.isPending} disabled={!form.isDirty()}>Save</Button>
          </Stack>
        </form>
      </Paper>
    </>
  )
}
