import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/rooms', element: <RoomsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])
