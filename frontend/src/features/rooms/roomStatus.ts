import { RoomStatus } from '@/api/generated'

export const ROOM_STATUS: Record<RoomStatus, { label: string; color: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Available', color: 'teal' },
  [RoomStatus.NEEDS_CLEANING]: { label: 'Needs cleaning', color: 'yellow' },
  [RoomStatus.TAKEN]: { label: 'Taken', color: 'blue' },
}

export const ROOM_STATUS_OPTIONS = Object.entries(ROOM_STATUS).map(([value, { label }]) => ({ value, label }))
