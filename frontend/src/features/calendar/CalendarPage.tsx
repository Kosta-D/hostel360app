import { ActionIcon, Box, Button, Group, Paper, ScrollArea, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useListRooms, useListStays, type Room, type Stay } from '@/api/generated'
import { addDays, diffDays, fmtDate, today } from '@/shared/dates'
import { PageHeader } from '@/shared/PageHeader'
import { StayDrawer, type StayTarget } from '@/features/stays/StayDrawer'
import { stayPeriod } from '@/features/stays/stayPeriod'
import { LONG_TERM, SOURCE, stayKind } from '@/features/stays/stayLabels'
import { useStayActions } from '@/features/stays/useStayActions'

const DAYS = 14
const ROOM_COL = 150
const DAY_W = 44

export function CalendarPage() {
  const [start, setStart] = useState(today)
  const end = addDays(start, DAYS)
  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i))
  const { data: rooms = [] } = useListRooms()
  const { data: stays = [] } = useListStays({ from: start, to: end })
  const [target, setTarget] = useState<StayTarget>(null)
  const actions = useStayActions(() => setTarget(null))
  const t = today()
  const grid = { display: 'grid', gridTemplateColumns: `${ROOM_COL}px repeat(${DAYS}, minmax(${DAY_W}px, 1fr))` }

  return (
    <>
      <PageHeader title="Calendar" description="Click an empty day to book, or a bar to edit" />
      <Group mb="md" justify="space-between" wrap="wrap">
        <Group gap="xs">
          <ActionIcon variant="default" aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}><IconChevronLeft size={16} /></ActionIcon>
          <Button variant="default" size="xs" onClick={() => setStart(today())}>Today</Button>
          <ActionIcon variant="default" aria-label="Next week" onClick={() => setStart(addDays(start, 7))}><IconChevronRight size={16} /></ActionIcon>
          <Text fw={600} ml="xs">{fmtDate(start)} – {fmtDate(addDays(end, -1))}</Text>
        </Group>
        <Group gap="md">
          {[SOURCE.BOOKING, SOURCE.DIRECT, LONG_TERM].map((k) => (
            <Group key={k.label} gap={6}><Box w={12} h={12} bg={`${k.color}.6`} style={{ borderRadius: 3 }} /><Text size="xs">{k.label}</Text></Group>
          ))}
        </Group>
      </Group>

      <Paper withBorder>
        <ScrollArea type="auto">
          <Box miw={ROOM_COL + DAYS * DAY_W}>
            <Box style={grid} bg="var(--mantine-color-default-hover)">
              <Text size="xs" c="dimmed" p="xs">Room</Text>
              {days.map((d) => (
                <Box key={d} ta="center" py={4} c={d === t ? 'teal' : undefined} fw={d === t ? 700 : undefined}>
                  <Text size="10px" tt="uppercase" c="dimmed">{dayjs(d).format('dd')}</Text>
                  <Text size="sm" fw="inherit">{dayjs(d).format('D')}</Text>
                </Box>
              ))}
            </Box>
            {rooms.map((room) => (
              <RoomRow key={room.id} room={room} days={days} start={start} end={end} today={t} grid={grid}
                stays={stays.filter((s) => s.room.id === room.id && s.status !== 'CANCELLED')}
                onEmpty={(day) => setTarget({ defaults: { roomId: room.id, checkIn: day } })}
                onStay={(stay) => setTarget({ stay })} />
            ))}
          </Box>
        </ScrollArea>
      </Paper>
      <StayDrawer target={target} actions={actions} onClose={() => setTarget(null)} />
    </>
  )
}

interface RowProps {
  room: Room; days: string[]; start: string; end: string; today: string; grid: React.CSSProperties
  stays: Stay[]; onEmpty: (day: string) => void; onStay: (stay: Stay) => void
}

/** One room: a clickable cell per day, with stays drawn as bars spanning their nights. */
function RoomRow({ room, days, start, end, today, grid, stays, onEmpty, onStay }: RowProps) {
  return (
    <Box style={{ ...grid, borderTop: '1px solid var(--mantine-color-default-border)' }} h={44}>
      <Box p="xs" style={{ gridRow: 1, gridColumn: 1 }}>
        <Text size="sm" fw={600} truncate>{room.number} · {room.name}</Text>
      </Box>
      {days.map((d, i) => (
        <UnstyledButton key={d} aria-label={`Book room ${room.number} on ${fmtDate(d)}`} onClick={() => onEmpty(d)}
          style={{
            gridRow: 1, gridColumn: i + 2, borderLeft: '1px solid var(--mantine-color-default-border)',
            background: d === today ? 'var(--mantine-color-teal-light)' : dayjs(d).day() % 6 === 0 ? 'var(--mantine-color-default-hover)' : undefined,
          }} />
      ))}
      {stays.map((s) => {
        const from = s.checkIn > start ? s.checkIn : start
        const to = s.checkOut && s.checkOut < end ? s.checkOut : end
        const kind = stayKind(s)
        return (
          <Tooltip key={s.id} label={`${s.guest.name} · ${stayPeriod(s)}`} withinPortal>
            <UnstyledButton onClick={() => onStay(s)} px={6} my={6} mx={2}
              bg={`${kind.color}.6`} c="white" fz="xs" fw={600}
              style={{
                gridRow: 1, gridColumn: `${diffDays(start, from) + 2} / ${diffDays(start, to) + 2}`, zIndex: 1,
                borderRadius: 6, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                opacity: s.status === 'CHECKED_OUT' ? 0.45 : 1,
              }}>
              {s.guest.name}
            </UnstyledButton>
          </Tooltip>
        )
      })}
    </Box>
  )
}
