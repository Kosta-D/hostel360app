import { ActionIcon, Badge, Button, Group, Menu, Paper, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconDots, IconDoorEnter, IconDoorExit, IconPencil, IconTrash, IconX } from '@tabler/icons-react'
import type { Stay } from '@/api/generated'
import { money } from '@/shared/format'
import { stayPeriod } from './stayPeriod'
import { PAYMENT, STATUS, stayKind } from './stayLabels'
import type { useStayActions } from './useStayActions'

interface Props { stay: Stay; actions: ReturnType<typeof useStayActions>; onEdit: (stay: Stay) => void }

export function StayCard({ stay, actions, onEdit }: Props) {
  const kind = stayKind(stay)
  const confirm = (title: string, label: string, onConfirm: () => void) =>
    modals.openConfirmModal({ title, labels: { confirm: label, cancel: 'Back' }, confirmProps: { color: 'red' }, onConfirm })

  return (
    <Paper withBorder p="sm">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="xs" style={{ minWidth: 0 }}>
          <Text fw={700} truncate>{stay.guest.name}</Text>
          {stay.guest.country && <Text size="sm" c="dimmed">{stay.guest.country}</Text>}
        </Group>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target><ActionIcon variant="subtle" aria-label="More actions"><IconDots size={16} /></ActionIcon></Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit(stay)}>Edit</Menu.Item>
            {stay.status === 'BOOKED' && (
              <Menu.Item leftSection={<IconX size={14} />}
                onClick={() => confirm(`Cancel ${stay.guest.name}'s stay?`, 'Cancel stay', () => actions.cancel.mutate({ id: stay.id }))}>
                Cancel stay
              </Menu.Item>
            )}
            <Menu.Item color="red" leftSection={<IconTrash size={14} />}
              onClick={() => confirm(`Delete ${stay.guest.name}'s stay?`, 'Delete', () => actions.remove.mutate({ id: stay.id }))}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Text size="sm">Room <b>{stay.room.number}</b> · {stay.room.name} · {stay.people} {stay.people > 1 ? 'people' : 'person'}</Text>
      <Text size="sm" c="dimmed">{stayPeriod(stay)}</Text>
      {stay.note && <Text size="xs" c="dimmed">{stay.note}</Text>}

      <Group justify="space-between" align="flex-end" mt={6} gap="xs">
        <Group gap={6}>
          <Badge variant="light" color={kind.color}>{kind.label}</Badge>
          <Badge variant="outline" color={STATUS[stay.status].color}>{STATUS[stay.status].label}</Badge>
          {stay.longTerm ? (
            <Badge variant="dot" color="gray">{money(stay.amount, stay.currency)} / month</Badge>
          ) : (
            <Badge variant="dot" color={PAYMENT[stay.paymentStatus].color}>
              {money(stay.amount, stay.currency)} · {PAYMENT[stay.paymentStatus].label}
            </Badge>
          )}
        </Group>
        {stay.status === 'BOOKED' && (
          <Button size="xs" leftSection={<IconDoorEnter size={14} />} loading={actions.checkIn.isPending}
            onClick={() => actions.checkIn.mutate({ id: stay.id })}>Check in</Button>
        )}
        {stay.status === 'CHECKED_IN' && (
          <Button size="xs" variant="light" leftSection={<IconDoorExit size={14} />} loading={actions.checkOut.isPending}
            onClick={() => actions.checkOut.mutate({ id: stay.id })}>Check out</Button>
        )}
      </Group>
    </Paper>
  )
}
