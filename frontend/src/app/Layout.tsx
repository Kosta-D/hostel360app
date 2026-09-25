import { AppShell, Badge, Burger, Group, NavLink, Text, Title, Tooltip, ActionIcon, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconHome2, IconLogout, IconMoon, IconSun } from '@tabler/icons-react'
import { Navigate, NavLink as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGetSettings } from '@/api/generated'
import { auth } from './auth'
import { NAV } from './nav'

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { data: settings } = useGetSettings({ query: { enabled: !!auth.token() } })

  if (!auth.token()) return <Navigate to="/login" replace />

  const logout = () => { auth.clear(); navigate('/login') }

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconHome2 size={22} color="var(--mantine-primary-color-filled)" />
            <Title order={4}>{settings?.hostelName ?? 'Hostel360'}</Title>
          </Group>
          <Group gap="xs">
            <Tooltip label="Toggle theme">
              <ActionIcon variant="subtle" onClick={toggleColorScheme} aria-label="Toggle theme">
                {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Log out">
              <ActionIcon variant="subtle" onClick={logout} aria-label="Log out"><IconLogout size={18} /></ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        {NAV.map(({ label, path, icon: Icon, ready }) => (
          <NavLink
            key={path}
            component={RouterLink}
            to={path}
            label={label}
            leftSection={<Icon size={18} stroke={1.6} />}
            rightSection={ready ? null : <Badge size="xs" variant="light" color="gray">Soon</Badge>}
            active={path === '/' ? pathname === '/' : pathname.startsWith(path)}
            disabled={!ready}
            onClick={close}
          />
        ))}
        <Text size="xs" c="dimmed" mt="auto" px="sm">Hostel360 v0.1</Text>
      </AppShell.Navbar>

      <AppShell.Main><Outlet /></AppShell.Main>
    </AppShell>
  )
}
