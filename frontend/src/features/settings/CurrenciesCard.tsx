import { ActionIcon, Button, Group, Modal, NumberInput, Paper, Stack, Switch, Table, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getListCurrenciesQueryKey, useCreateCurrency, useDeleteCurrency, useListCurrencies, useUpdateCurrency,
  type Currency, type CurrencyRequest,
} from '@/api/generated'
import { money } from '@/shared/format'
import { notify } from '@/shared/notify'

/** Currencies the manager accepts, each with "1 EUR = rate". EUR is the base and fixed. */
export function CurrenciesCard() {
  const { data: currencies = [] } = useListCurrencies()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Currency | 'new' | null>(null)
  const opts = (message: string) => ({
    mutation: {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCurrenciesQueryKey() }); notify.ok(message); setEditing(null) },
      onError: notify.error,
    },
  })
  const create = useCreateCurrency(opts('Currency added'))
  const update = useUpdateCurrency(opts('Currency saved'))
  const remove = useDeleteCurrency(opts('Currency deleted'))

  const confirmDelete = (c: Currency) =>
    modals.openConfirmModal({
      title: `Delete ${c.code}?`,
      children: <Text size="sm">Nothing uses it yet, so it can be removed from the list.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ code: c.code }),
    })

  return (
    <Paper withBorder p="lg" maw={640}>
      <Group justify="space-between" mb="xs">
        <Title order={4}>Currencies</Title>
        <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => setEditing('new')}>Add currency</Button>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        EUR is the base for all totals. Changing a rate only affects new amounts; past stays and expenses keep the rate they were saved with.
      </Text>
      <Table verticalSpacing="xs">
        <Table.Tbody>
          {currencies.map((c) => (
            <Table.Tr key={c.code} c={c.active ? undefined : 'dimmed'}>
              <Table.Td fw={600} w={60}>{c.code}</Table.Td>
              <Table.Td>{c.name}{!c.active && ' (off)'}</Table.Td>
              <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>{c.code === 'EUR' ? 'Base' : `1 EUR = ${c.rate} ${c.code}`}</Table.Td>
              <Table.Td w={72}>
                {c.code !== 'EUR' && (
                  <Group gap={4} justify="flex-end" wrap="nowrap">
                    <ActionIcon variant="subtle" color="gray" aria-label={`Edit ${c.code}`} onClick={() => setEditing(c)}><IconPencil size={16} /></ActionIcon>
                    {!c.inUse && (
                      <ActionIcon variant="subtle" color="red" aria-label={`Delete ${c.code}`} onClick={() => confirmDelete(c)}><IconTrash size={16} /></ActionIcon>
                    )}
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Modal opened={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add currency' : `Edit ${editing?.code}`}>
        {editing !== null && (
          <CurrencyForm
            currency={editing === 'new' ? undefined : editing}
            saving={create.isPending || update.isPending}
            onSubmit={(data) => (editing === 'new' ? create.mutate({ data }) : update.mutate({ code: editing.code, data }))}
          />
        )}
      </Modal>
    </Paper>
  )
}

function CurrencyForm({ currency, saving, onSubmit }: { currency?: Currency; saving: boolean; onSubmit: (data: CurrencyRequest) => void }) {
  const form = useForm<CurrencyRequest>({
    initialValues: currency ? { code: currency.code, name: currency.name, rate: currency.rate, active: currency.active }
      : { code: '', name: '', rate: 0, active: true },
    transformValues: (v) => ({ ...v, code: v.code.trim().toUpperCase(), name: v.name.trim() }),
    validate: {
      code: (v) => (/^[A-Za-z]{3}$/.test(v.trim()) ? null : '3 letters, like USD'),
      name: (v) => (v.trim() ? null : 'Required'),
      rate: (v) => (v > 0 ? null : 'Must be greater than 0'),
    },
  })
  const code = form.values.code.trim().toUpperCase()
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Group grow align="flex-start">
          <TextInput label="Code" placeholder="USD" maxLength={3} disabled={!!currency} data-autofocus {...form.getInputProps('code')} />
          <TextInput label="Name" placeholder="US dollar" {...form.getInputProps('name')} />
        </Group>
        <NumberInput label="1 EUR =" suffix={code ? ` ${code}` : undefined} min={0} decimalScale={6} {...form.getInputProps('rate')} />
        {/^[A-Z]{3}$/.test(code) && form.values.rate > 0 && (
          <Text size="sm" c="dimmed" mt={-8}>Example: {money(100)} = {money(100 * form.values.rate, code)}</Text>
        )}
        {currency && (
          <Switch label="In use" description="Switched off, it no longer appears when you enter amounts. Old records keep it."
            {...form.getInputProps('active', { type: 'checkbox' })} />
        )}
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
