import { BarChart } from '@mantine/charts'
import { Paper, Table, Text } from '@mantine/core'
import dayjs from 'dayjs'
import type { MonthSummary } from '@/api/generated'
import { money } from '@/shared/format'
import { SERIES } from './financeLabels'

/** Twelve months side by side: a chart of income vs costs and a table with the profit. */
export function YearTab({ months, onPick }: { months?: MonthSummary[]; onPick: (month: string) => void }) {
  if (!months) return <Text c="dimmed" size="sm">Loading…</Text>
  const data = months.map((m) => ({ month: dayjs(m.month).format('MMM'), Income: m.income, Costs: m.costs }))
  const total = (key: 'income' | 'costs' | 'profit') => months.reduce((sum, m) => sum + m[key], 0)

  return (
    <>
      <Paper withBorder p="md" mb="md">
        <BarChart
          h={260}
          data={data}
          dataKey="month"
          series={[{ name: 'Income', color: SERIES.income }, { name: 'Costs', color: SERIES.costs }]}
          withLegend
          legendProps={{ verticalAlign: 'top' }}
          valueFormatter={(v) => money(v)}
          gridAxis="y"
          barProps={{ radius: [4, 4, 0, 0] }}
          yAxisProps={{ width: 70 }}
        />
      </Paper>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={420}>
          <Table highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Month</Table.Th>
                <Table.Th ta="right">Income</Table.Th>
                <Table.Th ta="right">Costs</Table.Th>
                <Table.Th ta="right">Profit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {months.map((m) => (
                <Table.Tr key={m.month} onClick={() => onPick(m.month)} style={{ cursor: 'pointer' }}>
                  <Table.Td>{dayjs(m.month).format('MMMM')}</Table.Td>
                  <Table.Td ta="right">{money(m.income)}</Table.Td>
                  <Table.Td ta="right">{money(m.costs)}</Table.Td>
                  <Table.Td ta="right" fw={600} c={m.profit < 0 ? 'red' : undefined}>{money(m.profit)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th>Year</Table.Th>
                <Table.Th ta="right">{money(total('income'))}</Table.Th>
                <Table.Th ta="right">{money(total('costs'))}</Table.Th>
                <Table.Th ta="right">{money(total('profit'))}</Table.Th>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  )
}
