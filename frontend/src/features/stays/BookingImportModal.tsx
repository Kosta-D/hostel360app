import { Alert, Button, FileInput, List, Modal, Select, SimpleGrid, Stack, Text } from '@mantine/core'
import { IconFileSpreadsheet } from '@tabler/icons-react'
import { useState } from 'react'
import { useImportBooking, type BookingImportResult } from '@/api/generated'
import { StatCard } from '@/shared/StatCard'
import { notify } from '@/shared/notify'
import { useProperties } from '@/shared/properties'
import { useRefreshStays } from './useStayActions'

/** Upload the reservations export from the Booking.com extranet and show what was imported. */
export function BookingImportModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<BookingImportResult | null>(null)
  const { properties, several } = useProperties()
  const [picked, setPicked] = useState<string | null>(null)
  const propertyId = picked ?? (properties[0] ? String(properties[0].id) : null)
  const refresh = useRefreshStays()
  const upload = useImportBooking({
    mutation: {
      onSuccess: (r) => {
        setResult(r)
        refresh()
      },
      onError: notify.error,
    },
  })

  const close = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <Modal opened={opened} onClose={close} title="Import from Booking.com" size="lg">
      {result ? (
        <Stack>
          <SimpleGrid cols={{ base: 1, xs: 3 }}>
            <StatCard label="Imported" value={result.imported} />
            <StatCard label="Already in the app" value={result.alreadyInApp} />
            <StatCard label="Cancelled or no-show" value={result.notImported} />
          </SimpleGrid>
          {result.shortened.length > 0 && (
            <Alert color="ink" title="Ended early (the next guest got the room)">
              <List size="sm">{result.shortened.map((s) => <List.Item key={s}>{s}</List.Item>)}</List>
            </Alert>
          )}
          {result.problems.length > 0 && (
            <Alert color="red" title="Not imported">
              <List size="sm">{result.problems.map((s) => <List.Item key={s}>{s}</List.Item>)}</List>
            </Alert>
          )}
          <Button onClick={close}>Done</Button>
        </Stack>
      ) : (
        <Stack>
          <Text size="sm" c="dimmed">
            In the extranet, open Reservations, pick the dates and download the list as Excel. Only confirmed reservations are
            imported, and ones already in the app are skipped, so the same file can be uploaded again.
          </Text>
          {several && (
            <Select label="Property" description="Each property has its own Booking.com account and export" allowDeselect={false}
              data={properties.map((p) => ({ value: String(p.id), label: p.name }))} value={propertyId} onChange={setPicked} />
          )}
          <FileInput label="Reservations export" placeholder="Choose .xls or .xlsx file" accept=".xls,.xlsx"
            leftSection={<IconFileSpreadsheet size={16} />} value={file} onChange={setFile} clearable />
          <Button disabled={!file || !propertyId} loading={upload.isPending}
            onClick={() => file && propertyId && upload.mutate({ data: { file }, params: { propertyId: Number(propertyId) } })}>
            Import
          </Button>
        </Stack>
      )}
    </Modal>
  )
}
