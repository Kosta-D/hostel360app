import { Badge, Menu, UnstyledButton } from '@mantine/core'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import type { RoomStatus } from '@/api/generated'
import { ROOM_STATUS } from './roomStatus'

/** Status badge that doubles as a quick status switcher. */
export function RoomStatusBadge({ status, onChange }: { status: RoomStatus; onChange: (status: RoomStatus) => void }) {
  const { label, color } = ROOM_STATUS[status]
  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <UnstyledButton aria-label={`Status: ${label}. Change status`}>
          <Badge variant="light" color={color} rightSection={<IconChevronDown size={12} />} style={{ cursor: 'pointer' }}>
            {label}
          </Badge>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {(Object.keys(ROOM_STATUS) as RoomStatus[]).map((s) => (
          <Menu.Item
            key={s}
            color={ROOM_STATUS[s].color}
            rightSection={s === status ? <IconCheck size={14} /> : null}
            onClick={() => s !== status && onChange(s)}
          >
            {ROOM_STATUS[s].label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
