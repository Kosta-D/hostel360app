import { Drawer } from '@mantine/core'
import type { Stay } from '@/api/generated'
import { StayForm, type StayDefaults } from './StayForm'
import type { useStayActions } from './useStayActions'

/** What the drawer is editing: an existing stay, or a new one with optional defaults. */
export type StayTarget = { stay: Stay } | { defaults: StayDefaults } | null

interface Props { target: StayTarget; actions: ReturnType<typeof useStayActions>; onClose: () => void }

export function StayDrawer({ target, actions, onClose }: Props) {
  const stay = target && 'stay' in target ? target.stay : undefined
  return (
    <Drawer opened={!!target} onClose={onClose} position="right" size="md" title={stay ? 'Edit stay' : 'New stay'}>
      {target && (
        <StayForm
          key={stay?.id ?? 'new'}
          stay={stay}
          defaults={'defaults' in target ? target.defaults : undefined}
          saving={actions.create.isPending || actions.update.isPending}
          onSubmit={(data) => (stay ? actions.update.mutate({ id: stay.id, data }) : actions.create.mutate({ data }))}
        />
      )}
    </Drawer>
  )
}
