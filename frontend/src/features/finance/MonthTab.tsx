import { Group, Paper, SimpleGrid, Table, Text, Title } from '@mantine/core'
import { IconArrowDownRight, IconArrowUpRight, IconScale } from '@tabler/icons-react'
import type { MonthSummary } from '@/api/generated'
import { money } from '@/shared/format'
import { StatCard } from '@/shared/StatCard'
import { useGetSettings } from '@/api/generated'
import { CATEGORY } from './financeLabels'
import { Eur } from './Eur'

/** One month's profit and loss: income by source, costs by category, and the profit. */
export function MonthTab({ summary }: { summary?: MonthSummary }) {
  const { data: settings } = useGetSettings()
  if (!summary) return <Text c="dimmed" size="sm">Loading…</Text>
  const rsd = (v: number) => (settings ? money(v * settings.eurToRsd, 'RSD') : undefined)

  const income: [string, number][] = [
    ['Booking.com', summary.booking],
    ['Direct', summary.direct],
    ['Long term', summary.longTerm],
  ]
  const costs: [string, number][] = [
    [`Booking.com commission (${settings?.bookingCommission ?? 15}%)`, summary.commission],
    ...summary.byCategory.map((c): [string, number] => [CATEGORY[c.category], c.amount]),
  ]
  const rows = (items: [string, number][], total: number, totalLabel: string) => (
    <Table verticalSpacing="xs">
      <Table.Tbody>
        {items.map(([label, value]) => (
          <Table.Tr key={label}>
            <Table.Td>{label}</Table.Td>
            <Table.Td ta="right"><Eur value={value} /></Table.Td>
          </Table.Tr>
        ))}
        <Table.Tr>
          <Table.Td fw={700}>{totalLabel}</Table.Td>
          <Table.Td ta="right"><Eur value={total} strong /></Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        <StatCard label="Income" value={money(summary.income)} hint={`${summary.arrivals} arrivals · ${rsd(summary.income) ?? ''}`} icon={IconArrowUpRight} />
        <StatCard label="Costs" value={money(summary.costs)} hint={rsd(summary.costs)} icon={IconArrowDownRight} />
        <StatCard label="Profit" value={money(summary.profit)} hint={rsd(summary.profit)} icon={IconScale} />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder p="md">
          <Title order={5} mb="xs">Income</Title>
          {rows(income, summary.income, 'Total income')}
        </Paper>
        <Paper withBorder p="md">
          <Group justify="space-between" mb="xs"><Title order={5}>Costs</Title></Group>
          {rows(costs, summary.costs, 'Total costs')}
        </Paper>
      </SimpleGrid>
      <Paper withBorder p="md" mt="md">
        <Group justify="space-between">
          <Title order={4}>Profit</Title>
          <Eur value={summary.profit} strong />
        </Group>
      </Paper>
    </>
  )
}
