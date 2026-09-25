import { Alert, Button, FileInput, List, Modal, SimpleGrid, Stack, Text } from '@mantine/core'
import { IconBan, IconCheck, IconCopy, IconFileSpreadsheet } from '@tabler/icons-react'
import { useState } from 'react'
import { useImportBooking, type BookingImportResult } from '@/api/generated'
import { StatCard } from '@/shared/StatCard'
import { notify } from '@/shared/notify'
import { useRefreshStays } from './useStayActions'

/** Upload the reservations export from the Booking.com extranet and show what was imported. */
export function BookingImportModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<BookingImportResult | null>(null)
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
            <StatCard label="Imported" value={result.imported} icon={IconCheck} />
            <StatCard label="Already in the app" value={result.alreadyInApp} icon={IconCopy} />
            <StatCard label="Cancelled or no-show" value={result.notImported} icon={IconBan} />
          </SimpleGrid>
          {result.shortened.length > 0 && (
            <Alert color="blue" title="Ended early (the next guest got the room)">
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
          <FileInput label="Reservations export" placeholder="Choose .xls or .xlsx file" accept=".xls,.xlsx"
            leftSection={<IconFileSpreadsheet size={16} />} value={file} onChange={setFile} clearable />
          <Button disabled={!file} loading={upload.isPending} onClick={() => file && upload.mutate({ data: { file } })}>
            Import
          </Button>
        </Stack>
      )}
    </Modal>
  )
}
