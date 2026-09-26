import {
  IconBed, IconCalendar, IconCash, IconChartBar, IconClipboardList, IconLayoutDashboard, IconSettings, IconTool, IconUsers, type Icon,
} from '@tabler/icons-react'

export interface NavItem { label: string; path: string; icon: Icon; ready: boolean }

/** Single source for the sidebar. Flip `ready` as each module ships. */
export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: IconLayoutDashboard, ready: true },
  { label: 'Rooms', path: '/rooms', icon: IconBed, ready: true },
  { label: 'Stays', path: '/stays', icon: IconClipboardList, ready: true },
  { label: 'Calendar', path: '/calendar', icon: IconCalendar, ready: true },
  { label: 'Guests', path: '/guests', icon: IconUsers, ready: true },
  { label: 'Finance', path: '/finance', icon: IconCash, ready: true },
  { label: 'Statistics', path: '/statistics', icon: IconChartBar, ready: true },
  { label: 'Maintenance', path: '/maintenance', icon: IconTool, ready: false },
  { label: 'Settings', path: '/settings', icon: IconSettings, ready: true },
]
