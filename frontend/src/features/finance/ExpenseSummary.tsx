import { Group, Paper, Progress, SegmentedControl, SimpleGrid, Table, Text, Title } from '@mantine/core'
import { IconBuildingWarehouse, IconTool } from '@tabler/icons-react'
import dayjs from 'dayjs'
import type { ExpenseCategory, MonthSummary } from '@/api/generated'
import { fmtMonth } from '@/shared/dates'
import { money } from '@/shared/format'
import { StatCard } from '@/shared/StatCard'
import { CATEGORY, GROUPS } from './financeLabels'

export type Span = 'month' | 'year'

const ICONS = [IconBuildingWarehouse, IconTool]

/** Invested and Maintenance totals plus cost per category, for the picked month or its whole year. */
export function ExpenseSummary({ months, month, span, onSpan }: {
  months?: MonthSummary[]; month: string; span: Span; onSpan: (s: Span) => void
}) {
  const picked = span === 'year' ? months ?? [] : months ? [months[dayjs(month).month()]] : []
  const byCategory = new Map<ExpenseCategory, number>()
  picked.forEach((m) => m.byCategory.forEach((c) => byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + c.amount)))
  const rows = [...byCategory].sort((a, b) => b[1] - a[1])
  const total = rows.reduce((sum, [, v]) => sum + v, 0)
  const share = (v: number) => (total ? Math.round((v / total) * 100) : 0)
  const title = span === 'year' ? String(dayjs(month).year()) : fmtMonth(month)

  return (
    <>
      <Group justify="space-between" mb="sm">
        <Text fw={600}>{title}: {money(total)}</Text>
        <SegmentedControl size="xs" value={span} onChange={(v) => onSpan(v as Span)}
          data={[{ value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }]} />
      </Group>
      <SimpleGrid cols={{ base: 1, xs: 2 }} mb="md">
        {GROUPS.map((g, i) => {
          const sum = g.categories.reduce((s, c) => s + (byCategory.get(c) ?? 0), 0)
          return <StatCard key={g.label} label={g.label} value={money(sum)} hint={`${share(sum)}% · ${g.hint}`} icon={ICONS[i]} />
        })}
      </SimpleGrid>
      <Paper withBorder p="md" mb="lg">
        <Title order={5} mb="xs">By category</Title>
        {rows.length === 0 ? (
          <Text c="dimmed" size="sm">No expenses.</Text>
        ) : (
          <Table verticalSpacing="xs">
            <Table.Tbody>
              {rows.map(([category, amount]) => (
                <Table.Tr key={category}>
                  <Table.Td>{CATEGORY[category]}</Table.Td>
                  <Table.Td w="35%" visibleFrom="xs"><Progress value={share(amount)} size="sm" /></Table.Td>
                  <Table.Td ta="right" w={50} c="dimmed">{share(amount)}%</Table.Td>
                  <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>{money(amount)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </>
  )
}
