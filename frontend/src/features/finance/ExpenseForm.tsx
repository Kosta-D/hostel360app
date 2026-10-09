import { Button, Group, Input, NumberInput, Select, Stack, Switch, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import type { Expense, ExpenseRequest } from '@/api/generated'
import { CurrencyPicker, PrimaryHint } from '@/shared/currency'
import { today } from '@/shared/dates'
import { primaryCurrency } from '@/shared/format'
import { useProperties } from '@/shared/properties'
import { CATEGORY_OPTIONS } from './financeLabels'

const SHARED = 'shared'

export function ExpenseForm({ expense, saving, onSubmit }: { expense?: Expense; saving: boolean; onSubmit: (data: ExpenseRequest) => void }) {
  const { properties, several } = useProperties()
  const form = useForm<ExpenseRequest>({
    initialValues: expense
      ? { propertyId: expense.propertyId, date: expense.date, category: expense.category, amount: expense.amount, currency: expense.currency, note: expense.note ?? '', repeatMonthly: expense.repeatMonthly }
      : { date: today(), category: 'CLEANING', amount: 0, currency: primaryCurrency(), note: '', repeatMonthly: false },
    validate: { amount: (v) => (v > 0 ? null : 'Enter the amount') },
  })

  // A new expense belongs to the first property until another one (or Shared) is picked.
  return (
    <form onSubmit={form.onSubmit((v) => onSubmit({ ...v, propertyId: v.propertyId === undefined ? properties[0]?.id : v.propertyId }))}>
      <Stack>
        {several && (
          <Select label="Property" allowDeselect={false} description="Shared: a cost for all properties, like the accountant"
            data={[...properties.map((p) => ({ value: String(p.id), label: p.name })), { value: SHARED, label: 'Shared (all properties)' }]}
            value={form.values.propertyId === null ? SHARED : String(form.values.propertyId ?? properties[0]?.id)}
            onChange={(v) => form.setFieldValue('propertyId', v === SHARED ? null : Number(v))} />
        )}
        <DateInput label="Date" valueFormat="D.M.YYYY" {...form.getInputProps('date')} />
        <Select label="Category" data={CATEGORY_OPTIONS} allowDeselect={false} searchable {...form.getInputProps('category')} />
        <Group grow align="flex-start">
          <NumberInput label="Amount" min={0} decimalScale={2} thousandSeparator="." decimalSeparator="," data-autofocus {...form.getInputProps('amount')} />
          <Input.Wrapper label="Currency">
            <CurrencyPicker value={form.values.currency} onChange={(v) => form.setFieldValue('currency', v)} />
          </Input.Wrapper>
        </Group>
        <PrimaryHint amount={form.values.amount} currency={form.values.currency} />
        <Textarea label="Note" placeholder="Optional" autosize minRows={2} {...form.getInputProps('note')} />
        <Switch label="Repeats every month" description="For fixed costs like internet or the accountant"
          {...form.getInputProps('repeatMonthly', { type: 'checkbox' })} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
