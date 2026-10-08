import { Box, Text } from '@mantine/core'

/** One figure in a row of figures: small label, big number, optional hint, hairline on top. */
export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Box pt="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text fz={30} fw={600} lh={1.15} mt={4} style={{ letterSpacing: '-0.03em' }}>{value}</Text>
      {hint && <Text size="xs" c="dimmed" mt={4}>{hint}</Text>}
    </Box>
  )
}
