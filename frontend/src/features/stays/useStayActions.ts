import { useQueryClient } from '@tanstack/react-query'
import {
  getListGuestsQueryKey, getListRoomsQueryKey, getListStaysQueryKey,
  useCancelStay, useCheckIn, useCheckOut, useCreateStay, useDeleteStay, useUpdateStay,
} from '@/api/generated'
import { notify } from '@/shared/notify'

/** Reloads everything a stay change can affect: stays, rooms and guests. */
export function useRefreshStays() {
  const queryClient = useQueryClient()
  return () => {
    for (const key of [getListStaysQueryKey(), getListRoomsQueryKey(), getListGuestsQueryKey()]) {
      queryClient.invalidateQueries({ queryKey: [key[0]] })
    }
  }
}

/** All stay mutations in one place; each refreshes stays, rooms and guests on success. */
export function useStayActions(onSaved?: () => void) {
  const refresh = useRefreshStays()
  const done = (message: string, close = false) => () => {
    refresh()
    notify.ok(message)
    if (close) onSaved?.()
  }
  const opts = (message: string, close = false) => ({ mutation: { onSuccess: done(message, close), onError: notify.error } })

  return {
    create: useCreateStay(opts('Stay saved', true)),
    update: useUpdateStay(opts('Stay saved', true)),
    remove: useDeleteStay(opts('Stay deleted', true)),
    checkIn: useCheckIn(opts('Checked in')),
    checkOut: useCheckOut(opts('Checked out, room needs cleaning')),
    cancel: useCancelStay(opts('Stay cancelled')),
  }
}
