import { Button, Group, NumberInput, SegmentedControl, Select, Stack, Switch, Textarea } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import type { Expense, ExpenseRequest } from '@/api/generated'
import { today } from '@/shared/dates'
import { CATEGORY_OPTIONS } from './financeLabels'

export function ExpenseForm({ expense, saving, onSubmit }: { expense?: Expense; saving: boolean; onSubmit: (data: ExpenseRequest) => void }) {
  const form = useForm<ExpenseRequest>({
    initialValues: expense
      ? { date: expense.date, category: expense.category, amount: expense.amount, currency: expense.currency, note: expense.note ?? '', repeatMonthly: expense.repeatMonthly }
      : { date: today(), category: 'CLEANING', amount: 0, currency: 'EUR', note: '', repeatMonthly: false },
    validate: { amount: (v) => (v > 0 ? null : 'Enter the amount') },
  })

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <DateInput label="Date" valueFormat="D.M.YYYY" {...form.getInputProps('date')} />
        <Select label="Category" data={CATEGORY_OPTIONS} allowDeselect={false} searchable {...form.getInputProps('category')} />
        <Group grow align="flex-end">
          <NumberInput label="Amount" min={0} decimalScale={2} thousandSeparator="." decimalSeparator="," data-autofocus {...form.getInputProps('amount')} />
          <SegmentedControl data={['EUR', 'RSD']} value={form.values.currency} onChange={(v) => form.setFieldValue('currency', v as ExpenseRequest['currency'])} />
        </Group>
        <Textarea label="Note" placeholder="Optional" autosize minRows={2} {...form.getInputProps('note')} />
        <Switch label="Repeats every month" description="For fixed costs like internet or the accountant"
          {...form.getInputProps('repeatMonthly', { type: 'checkbox' })} />
        <Button type="submit" loading={saving}>Save</Button>
      </Stack>
    </form>
  )
}
