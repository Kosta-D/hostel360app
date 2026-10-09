import { useListProperties } from '@/api/generated'

/** All properties; `several` is false while there is only one, so property pickers stay hidden. */
export function useProperties() {
  const { data: properties = [] } = useListProperties()
  return { properties, several: properties.length > 1 }
}

/** "12 · Bunk" for a hostel room; just the name for an apartment. */
export const unitLabel = (r: { number: number; name: string; apartment: boolean }) => (r.apartment ? r.name : `${r.number} · ${r.name}`)

/** "Room 12" or the apartment's name, for sentences. */
export const unitName = (r: { number: number; name: string; apartment: boolean }) => (r.apartment ? r.name : `Room ${r.number}`)
