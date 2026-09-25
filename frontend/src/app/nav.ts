import {
  IconBed, IconBolt, IconCash, IconLayoutDashboard, IconSettings, IconTool, IconUsers, type Icon,
} from '@tabler/icons-react'

export interface NavItem { label: string; path: string; icon: Icon; ready: boolean }

/** Single source for the sidebar. Flip `ready` as each module ships. */
export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: IconLayoutDashboard, ready: true },
  { label: 'Rooms', path: '/rooms', icon: IconBed, ready: true },
  { label: 'Guests & Stays', path: '/stays', icon: IconUsers, ready: false },
  { label: 'Finance', path: '/finance', icon: IconCash, ready: false },
  { label: 'Utilities', path: '/utilities', icon: IconBolt, ready: false },
  { label: 'Maintenance', path: '/maintenance', icon: IconTool, ready: false },
  { label: 'Settings', path: '/settings', icon: IconSettings, ready: true },
]
