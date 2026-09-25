import { Group, Paper, Text, ThemeIcon } from '@mantine/core'
import type { Icon } from '@tabler/icons-react'

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint?: string; icon: Icon }) {
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
          <Text fz={28} fw={700} mt={4}>{value}</Text>
          {hint && <Text size="xs" c="dimmed">{hint}</Text>}
        </div>
        <ThemeIcon variant="light" size="lg"><Icon size={20} /></ThemeIcon>
      </Group>
    </Paper>
  )
}
