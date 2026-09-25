import { Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconHome2 } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useLogin, type LoginRequest } from '@/api/generated'
import { auth } from '@/app/auth'
import { notify } from '@/shared/notify'

export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<LoginRequest>({
    initialValues: { username: '', password: '' },
    validate: { username: (v) => (v ? null : 'Required'), password: (v) => (v ? null : 'Required') },
  })
  const login = useLogin({
    mutation: {
      onSuccess: ({ token }) => { auth.set(token); navigate('/', { replace: true }) },
      onError: notify.error,
    },
  })

  return (
    <Center mih="100vh" p="md" bg="var(--mantine-color-default-hover)">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={380}>
        <form onSubmit={form.onSubmit((data) => login.mutate({ data }))}>
          <Stack>
            <Stack gap={4} align="center">
              <IconHome2 size={36} color="var(--mantine-primary-color-filled)" />
              <Title order={3}>Hostel360</Title>
              <Text size="sm" c="dimmed">Sign in to manage your hostel</Text>
            </Stack>
            <TextInput label="Username" autoComplete="username" {...form.getInputProps('username')} />
            <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps('password')} />
            <Button type="submit" loading={login.isPending} fullWidth>Sign in</Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}
