import { ActionIcon, AppShell, Box, Burger, Center, Group, NavLink, Title, Tooltip, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLogout, IconMoon, IconSun } from '@tabler/icons-react'
import { Navigate, NavLink as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGetSettings } from '@/api/generated'
import { setPrimaryCurrency } from '@/shared/format'
import { auth } from './auth'
import { NAV } from './nav'

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { data: settings } = useGetSettings({ query: { enabled: !!auth.token() } })

  if (!auth.token()) return <Navigate to="/login" replace />
  if (settings) setPrimaryCurrency(settings.primaryCurrency)

  const logout = () => { auth.clear(); navigate('/login') }

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding={{ base: 'md', sm: 'xl' }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Center w={28} h={28} bg="var(--mantine-primary-color-filled)" c="white" fw={700} fz="sm" style={{ borderRadius: 7 }} aria-hidden>H</Center>
            <Title order={4} fw={600}>{settings?.hostelName ?? 'Hostel360'}</Title>
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

      <AppShell.Navbar p="sm">
        {NAV.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            component={RouterLink}
            to={path}
            label={label}
            leftSection={<Icon size={18} stroke={1.6} />}
            active={path === '/' ? pathname === '/' : pathname.startsWith(path)}
            onClick={close}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main><Box maw={1320}><Outlet /></Box></AppShell.Main>
    </AppShell>
  )
}
