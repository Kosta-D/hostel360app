import { RoomStatus } from '@/api/generated'

export const ROOM_STATUS: Record<RoomStatus, { label: string; color: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Available', color: 'teal' },
  [RoomStatus.CLEANING]: { label: 'Cleaning', color: 'yellow' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Out of order', color: 'red' },
}

export const ROOM_STATUS_OPTIONS = Object.entries(ROOM_STATUS).map(([value, { label }]) => ({ value, label }))
