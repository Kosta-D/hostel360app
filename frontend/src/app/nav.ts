import {
  IconBed, IconBuildingCommunity, IconCalendar, IconCash, IconChartBar, IconClipboardList, IconLayoutDashboard, IconSettings, IconUsers, type Icon,
} from '@tabler/icons-react'

export interface NavItem { label: string; path: string; icon: Icon }

/** Single source for the sidebar. */
export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: IconLayoutDashboard },
  { label: 'Rooms', path: '/rooms', icon: IconBed },
  { label: 'Stays', path: '/stays', icon: IconClipboardList },
  { label: 'Calendar', path: '/calendar', icon: IconCalendar },
  { label: 'Guests', path: '/guests', icon: IconUsers },
  { label: 'Finance', path: '/finance', icon: IconCash },
  { label: 'Statistics', path: '/statistics', icon: IconChartBar },
  { label: 'Properties', path: '/properties', icon: IconBuildingCommunity },
  { label: 'Settings', path: '/settings', icon: IconSettings },
]
