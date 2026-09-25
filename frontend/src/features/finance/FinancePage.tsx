import { ActionIcon, Group, Tabs, Text } from '@mantine/core'
import { MonthPickerInput } from '@mantine/dates'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useFinanceYear, useListUnpaid } from '@/api/generated'
import { ISO } from '@/shared/dates'
import { PageHeader } from '@/shared/PageHeader'
import { ExpensesTab } from './ExpensesTab'
import { MonthTab } from './MonthTab'
import { UnpaidTab } from './UnpaidTab'
import { YearTab } from './YearTab'

export function FinancePage() {
  const [tab, setTab] = useState<string | null>('month')
  const [month, setMonth] = useState(dayjs().startOf('month').format(ISO))
  const year = dayjs(month).year()
  const { data: months } = useFinanceYear(year)
  const { data: unpaid = [] } = useListUnpaid()
  const shift = (n: number) => setMonth(dayjs(month).add(n, tab === 'year' ? 'year' : 'month').format(ISO))

  const period = tab !== 'unpaid' && (
    <Group gap={4} wrap="nowrap">
      <ActionIcon variant="default" size="lg" onClick={() => shift(-1)} aria-label="Previous"><IconChevronLeft size={16} /></ActionIcon>
      {tab === 'year' ? (
        <Text fw={600} w={60} ta="center">{year}</Text>
      ) : (
        <MonthPickerInput w={150} value={month} valueFormat="MMMM YYYY" onChange={(v) => v && setMonth(dayjs(v).format(ISO))} />
      )}
      <ActionIcon variant="default" size="lg" onClick={() => shift(1)} aria-label="Next"><IconChevronRight size={16} /></ActionIcon>
    </Group>
  )

  return (
    <>
      <PageHeader title="Finance" description="Income counts on the arrival date. All totals in EUR." action={period} />
      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab value="month">Month</Tabs.Tab>
          <Tabs.Tab value="year">Year</Tabs.Tab>
          <Tabs.Tab value="expenses">Expenses</Tabs.Tab>
          <Tabs.Tab value="unpaid">Unpaid{unpaid.length ? ` (${unpaid.length})` : ''}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="month"><MonthTab summary={months?.[dayjs(month).month()]} /></Tabs.Panel>
        <Tabs.Panel value="year"><YearTab months={months} onPick={(m) => { setMonth(m); setTab('month') }} /></Tabs.Panel>
        <Tabs.Panel value="expenses"><ExpensesTab month={month} /></Tabs.Panel>
        <Tabs.Panel value="unpaid"><UnpaidTab /></Tabs.Panel>
      </Tabs>
    </>
  )
}
