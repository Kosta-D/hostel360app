import { BarChart } from '@mantine/charts'
import { Paper, SimpleGrid, Table, Text } from '@mantine/core'
import type { StatsCountry } from '@/api/generated'
import { money } from '@/shared/format'
import { SERIES } from './statsColors'

const name = (c: StatsCountry) => c.country ?? 'Unknown'

/** Top countries by nights as a bar chart, and every country in a table. */
export function CountryTable({ countries }: { countries: StatsCountry[] }) {
  if (!countries.length) return <Text c="dimmed" size="sm">No guests this year.</Text>
  const top = countries.slice(0, 8).map((c) => ({ country: name(c), Nights: c.nights }))
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <Paper withBorder p="md">
        <Text fw={600} mb="xs">Top countries by nights</Text>
        <BarChart h={Math.max(160, top.length * 34)} data={top} dataKey="country" orientation="vertical"
          series={[{ name: 'Nights', color: SERIES.booking }]} gridAxis="x" yAxisProps={{ width: 90 }}
          barProps={{ radius: [0, 4, 4, 0] }} />
      </Paper>
      <Paper withBorder>
        <Table.ScrollContainer minWidth={360} mah={380}>
          <Table stickyHeader verticalSpacing={6}>
            <Table.Thead>
              <Table.Tr><Table.Th>Country</Table.Th><Table.Th ta="right">Guests</Table.Th><Table.Th ta="right">Nights</Table.Th><Table.Th ta="right">Income</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countries.map((c) => (
                <Table.Tr key={name(c)}>
                  <Table.Td>{name(c)}</Table.Td>
                  <Table.Td ta="right">{c.guests}</Table.Td>
                  <Table.Td ta="right">{c.nights}</Table.Td>
                  <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>{money(c.income)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </SimpleGrid>
  )
}
