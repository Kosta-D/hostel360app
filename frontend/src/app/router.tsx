import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { GuestsPage } from '@/features/guests/GuestsPage'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { StaysPage } from '@/features/stays/StaysPage'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Layout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/rooms', element: <RoomsPage /> },
      { path: '/stays', element: <StaysPage /> },
      { path: '/calendar', element: <CalendarPage /> },
      { path: '/guests', element: <GuestsPage /> },
      { path: '/finance', element: <FinancePage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
])
