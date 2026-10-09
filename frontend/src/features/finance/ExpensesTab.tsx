import { ActionIcon, Badge, Button, Drawer, Group, Menu, Paper, Table, Text } from '@mantine/core'
import { IconDots, IconPencil, IconPlayerStop, IconPlus, IconTrash } from '@tabler/icons-react'
import { modals } from '@mantine/modals'
import { useState } from 'react'
import {
  useCreateExpense, useDeleteExpense, useListExpenses, useStopRepeating, useUpdateExpense, type Expense, type MonthSummary,
} from '@/api/generated'
import { fmtDate, fmtMonth } from '@/shared/dates'
import { money, primaryCurrency } from '@/shared/format'
import { notify } from '@/shared/notify'
import { useProperties } from '@/shared/properties'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseSummary, type Span } from './ExpenseSummary'
import { CATEGORY } from './financeLabels'
import { useFinanceRefresh } from './useFinanceRefresh'

type Target = { expense?: Expense } | null

export function ExpensesTab({ month, months }: { month: string; months?: MonthSummary[] }) {
  const [span, setSpan] = useState<Span>('month')
  const { data: expenses = [], isLoading } = useListExpenses({ month })
  const [target, setTarget] = useState<Target>(null)
  const refresh = useFinanceRefresh()
  const opts = (message: string, close = false) => ({
    mutation: { onSuccess: () => { refresh(); notify.ok(message); if (close) setTarget(null) }, onError: notify.error },
  })
  const create = useCreateExpense(opts('Expense saved', true))
  const update = useUpdateExpense(opts('Expense saved', true))
  const remove = useDeleteExpense(opts('Expense deleted'))
  const stop = useStopRepeating(opts('It will stop repeating after this month'))
  const { several } = useProperties()
  const total = expenses.reduce((sum, e) => sum + e.amountPrimary, 0)

  const confirmDelete = (e: Expense) =>
    modals.openConfirmModal({
      title: 'Delete expense?',
      children: <Text size="sm">{CATEGORY[e.category]}, {money(e.amount, e.currency)}{e.repeatMonthly ? ', in every month it repeats' : ''}.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ id: e.id }),
    })

  return (
    <>
      <ExpenseSummary months={months} month={month} span={span} onSpan={setSpan} />
      <Group justify="space-between" mb="sm">
        <Text fw={600}>Expenses in {fmtMonth(month)}: {money(total)}</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setTarget({})}>Add expense</Button>
      </Group>
      {expenses.length === 0 ? (
        <Text c="dimmed" size="sm" py="md">{isLoading ? 'Loading…' : 'No expenses this month.'}</Text>
      ) : (
        <Paper withBorder>
          <Table.ScrollContainer minWidth={480}>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr><Table.Th>Date</Table.Th><Table.Th>Category</Table.Th><Table.Th ta="right">Amount</Table.Th><Table.Th w={40} /></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expenses.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>{e.repeatMonthly ? <Badge variant="light">Monthly</Badge> : fmtDate(e.date)}</Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        <Text size="sm">{CATEGORY[e.category]}</Text>
                        {several && <Badge variant="default" size="sm">{e.propertyName ?? 'Shared'}</Badge>}
                      </Group>
                      {e.note && <Text size="xs" c="dimmed">{e.note}</Text>}
                    </Table.Td>
                    <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                      {money(e.amount, e.currency)}
                      {e.currency !== primaryCurrency() && <Text size="xs" c="dimmed">{money(e.amountPrimary)}</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end">
                        <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Actions"><IconDots size={16} /></ActionIcon></Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => setTarget({ expense: e })}>Edit</Menu.Item>
                          {e.repeatMonthly && !e.repeatUntil && (
                            <Menu.Item leftSection={<IconPlayerStop size={14} />} onClick={() => stop.mutate({ id: e.id })}>Stop repeating</Menu.Item>
                          )}
                          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => confirmDelete(e)}>Delete</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
      <Drawer opened={target !== null} onClose={() => setTarget(null)} position="right" title={target?.expense ? 'Edit expense' : 'Add expense'}>
        {target && (
          <ExpenseForm
            key={target.expense?.id ?? 'new'}
            expense={target.expense}
            saving={create.isPending || update.isPending}
            onSubmit={(data) => (target.expense ? update.mutate({ id: target.expense.id, data }) : create.mutate({ data }))}
          />
        )}
      </Drawer>
    </>
  )
}
