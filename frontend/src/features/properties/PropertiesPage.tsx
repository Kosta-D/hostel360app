import { ActionIcon, Badge, Button, Drawer, Group, Paper, SimpleGrid, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBuilding, IconHome, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useCreateProperty, useDeleteProperty, useUpdateProperty, type Property, type PropertyRequest } from '@/api/generated'
import { notify } from '@/shared/notify'
import { PageHeader } from '@/shared/PageHeader'
import { useProperties } from '@/shared/properties'
import { PropertyForm } from './PropertyForm'

export function PropertiesPage() {
  const { properties } = useProperties()
  const [editing, setEditing] = useState<Property | 'new' | null>(null)
  const queryClient = useQueryClient()

  // Rooms, stays and expenses show property names, so refresh everything.
  const done = (message: string) => () => { queryClient.invalidateQueries(); setEditing(null); notify.ok(message) }
  const onError = notify.error
  const create = useCreateProperty({ mutation: { onError, onSuccess: done('Property added') } })
  const update = useUpdateProperty({ mutation: { onError, onSuccess: done('Property saved') } })
  const remove = useDeleteProperty({ mutation: { onError, onSuccess: done('Property deleted') } })

  const save = (data: PropertyRequest) =>
    editing === 'new' ? create.mutate({ data }) : editing && update.mutate({ id: editing.id, data })

  const confirmDelete = (p: Property) =>
    modals.openConfirmModal({
      title: `Delete ${p.name}?`,
      children: <Text size="sm">Only possible while it has no stays or expenses. This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ id: p.id }),
    })

  return (
    <>
      <PageHeader
        title="Properties"
        description="A hostel has rooms; an apartment is rented as a whole"
        action={<Button leftSection={<IconPlus size={16} />} onClick={() => setEditing('new')}>Add property</Button>}
      />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {properties.map((p) => {
          const Icon = p.type === 'HOSTEL' ? IconBuilding : IconHome
          return (
            <Paper key={p.id} withBorder p="md">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group gap="sm" wrap="nowrap" miw={0}>
                  <Icon size={22} stroke={1.5} />
                  <div style={{ minWidth: 0 }}>
                    <Text fw={700} truncate>{p.name}</Text>
                    {p.address && <Text size="xs" c="dimmed" truncate>{p.address}</Text>}
                  </div>
                </Group>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon variant="subtle" aria-label="Edit" onClick={() => setEditing(p)}><IconPencil size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" aria-label="Delete" onClick={() => confirmDelete(p)}><IconTrash size={16} /></ActionIcon>
                </Group>
              </Group>
              <Group gap="xs" mt="sm">
                <Badge variant="light" color={p.type === 'HOSTEL' ? 'forest' : 'clay'}>{p.type === 'HOSTEL' ? 'Hostel' : 'Apartment'}</Badge>
                <Text size="sm" c="dimmed">
                  {p.type === 'HOSTEL' ? `${p.rooms} room${p.rooms === 1 ? '' : 's'}` : `Up to ${p.guests} guest${p.guests === 1 ? '' : 's'}`}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">Commission: Booking.com {p.bookingCommission}% · Airbnb {p.airbnbCommission}%</Text>
            </Paper>
          )
        })}
      </SimpleGrid>

      <Drawer opened={!!editing} onClose={() => setEditing(null)} position="right" title={editing === 'new' ? 'Add property' : 'Edit property'}>
        {editing && (
          <PropertyForm
            key={editing === 'new' ? 'new' : editing.id}
            property={editing === 'new' ? undefined : editing}
            saving={create.isPending || update.isPending}
            onSubmit={save}
          />
        )}
      </Drawer>
    </>
  )
}
