import { BarChart } from '@mantine/charts'
import { ActionIcon, Group, Paper, SimpleGrid, Table, Text, Title } from '@mantine/core'
import { IconBed, IconBrandBooking, IconCash, IconChevronLeft, IconChevronRight, IconMoon, IconReceipt, IconUsers, IconUsersGroup } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState, type ReactNode } from 'react'
import { useStatsYear, type StatsTotals } from '@/api/generated'
import { money } from '@/shared/format'
import { PageHeader } from '@/shared/PageHeader'
import { StatCard } from '@/shared/StatCard'
import { CountryTable } from './CountryTable'
import { RoomOccupancyTable } from './RoomOccupancyTable'
import { SERIES } from './statsColors'

/** "+12% vs 2025" when last year has data. */
const change = (cur: number, prev: number | undefined, year: number) => {
  if (prev === undefined || prev === 0) return undefined
  const pct = Math.round(((cur - prev) / prev) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% vs ${year - 1}`
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div>
    <Title order={4} mb={hint ? 0 : 'xs'}>{title}</Title>
    {hint && <Text size="sm" c="dimmed" mb="xs">{hint}</Text>}
    {children}
  </div>
)

export function StatisticsPage() {
  const [year, setYear] = useState(dayjs().year())
  const { data } = useStatsYear(year)
  const t = data?.totals
  const p = data?.previous ?? undefined
  const hint = (key: keyof StatsTotals, extra?: string) =>
    [extra, t && change(Number(t[key]), p ? Number(p[key]) : undefined, year)].filter(Boolean).join(' · ') || undefined

  const months = (data?.months ?? []).map((m) => ({
    month: dayjs(m.month).format('MMM'), Occupancy: m.occupancy,
    booking: m.booking, direct: m.direct, longTerm: m.longTerm,
  }))

  return (
    <>
      <PageHeader
        title="Statistics"
        description="Occupancy counts short-term rooms only. Money counts on the arrival date."
        action={
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="default" size="lg" onClick={() => setYear(year - 1)} aria-label="Previous year"><IconChevronLeft size={16} /></ActionIcon>
            <Text fw={600} w={60} ta="center">{year}</Text>
            <ActionIcon variant="default" size="lg" onClick={() => setYear(year + 1)} aria-label="Next year"><IconChevronRight size={16} /></ActionIcon>
          </Group>
        }
      />
      {!data || !t ? (
        <Text c="dimmed" size="sm">Loading…</Text>
      ) : (
        <SimpleGrid cols={1} spacing="xl">
          <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
            <StatCard label="Occupancy" value={`${t.occupancy}%`} hint={hint('occupancy')} icon={IconBed} />
            <StatCard label="Nights sold" value={t.nights} hint={hint('nights', `${t.stays} stays`)} icon={IconMoon} />
            <StatCard label="Price per night" value={money(t.avgPrice)} hint={hint('avgPrice')} icon={IconReceipt} />
            <StatCard label="Income" value={money(t.income)} hint={hint('income')} icon={IconCash} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Paper withBorder p="md">
              <Text fw={600} mb="xs">Occupancy by month (%)</Text>
              <BarChart h={240} data={months} dataKey="month" series={[{ name: 'Occupancy', color: SERIES.booking }]}
                valueFormatter={(v) => `${v}%`} gridAxis="y" yAxisProps={{ domain: [0, 100], width: 45 }} barProps={{ radius: [4, 4, 0, 0] }} />
            </Paper>
            <Paper withBorder p="md">
              <Text fw={600} mb="xs">Income by month</Text>
              <BarChart h={240} data={months} dataKey="month" type="stacked" withLegend legendProps={{ verticalAlign: 'top' }}
                series={[
                  { name: 'booking', label: 'Booking.com', color: SERIES.booking },
                  { name: 'direct', label: 'Direct', color: SERIES.direct },
                  { name: 'longTerm', label: 'Long term', color: SERIES.longTerm },
                ]}
                valueFormatter={(v) => money(v)} gridAxis="y" yAxisProps={{ width: 70 }} />
            </Paper>
          </SimpleGrid>

          <Section title="Months">
            <Paper withBorder>
              <Table.ScrollContainer minWidth={640}>
                <Table verticalSpacing={6} highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Month</Table.Th><Table.Th ta="right">Occupancy</Table.Th><Table.Th ta="right">Nights</Table.Th>
                      <Table.Th ta="right">Booking.com</Table.Th><Table.Th ta="right">Direct</Table.Th><Table.Th ta="right">Long term</Table.Th>
                      <Table.Th ta="right">Per night</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.months.map((m) => (
                      <Table.Tr key={m.month}>
                        <Table.Td>{dayjs(m.month).format('MMMM')}</Table.Td>
                        <Table.Td ta="right">{m.occupancy}%</Table.Td>
                        <Table.Td ta="right">{m.nightsSold}</Table.Td>
                        <Table.Td ta="right">{money(m.booking)}</Table.Td>
                        <Table.Td ta="right">{money(m.direct)}</Table.Td>
                        <Table.Td ta="right">{money(m.longTerm)}</Table.Td>
                        <Table.Td ta="right">{m.avgPrice ? money(m.avgPrice) : '–'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Section>

          <Section title="Rooms" hint="Occupancy of each room per month in %. LT means a long-term tenant.">
            <RoomOccupancyTable rooms={data.rooms} />
          </Section>

          <Section title="Guests">
            <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} mb="md">
              <StatCard label="Guests" value={t.guests} hint={`${t.returningGuests} came back`} icon={IconUsers} />
              <StatCard label="Average stay (nights)" value={t.avgStayNights.toFixed(1)} hint={hint('avgStayNights')} icon={IconMoon} />
              <StatCard label="Group size (people)" value={t.avgPeople.toFixed(1)} icon={IconUsersGroup} />
              <StatCard label="From Booking.com" value={`${t.bookingShareStays}%`} hint={`${t.bookingShareIncome}% of income`} icon={IconBrandBooking} />
            </SimpleGrid>
            <CountryTable countries={data.countries} />
          </Section>
        </SimpleGrid>
      )}
    </>
  )
}
