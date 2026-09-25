import { notifications } from '@mantine/notifications'
import { errorMessage } from '@/api/http'

export const notify = {
  ok: (message: string) => notifications.show({ color: 'teal', message }),
  error: (error: unknown) => notifications.show({ color: 'red', title: 'Error', message: errorMessage(error) }),
}
