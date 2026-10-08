import { Badge, NavLink, Paper, Table, createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core'

/** Accent: deep forest green. */
const forest: MantineColorsTuple = ['#eef5f1', '#dde9e2', '#b9d3c5', '#92bba6', '#6fa58a', '#559276', '#3f7c62', '#2f6550', '#24513f', '#183b2d']
/** Muted ink blue, used only for Booking.com. */
const ink: MantineColorsTuple = ['#eef2f7', '#dce3ec', '#b6c4d6', '#8ea3bf', '#6d87ab', '#58749e', '#4a6590', '#3d5479', '#324563', '#24324a']
/** Warm clay, used only for long-term tenants. */
const clay: MantineColorsTuple = ['#f8f1ec', '#eedfd4', '#dcbda8', '#c99a79', '#b97d54', '#ae6b3d', '#9a5c31', '#7f4b28', '#663d21', '#4a2c18']
/** Warm grays: one gray family for text, borders and surfaces. */
const gray: MantineColorsTuple = ['#f7f6f3', '#efede8', '#e3e0d9', '#d3cfc6', '#aaa59a', '#878276', '#6b665c', '#524e46', '#38352f', '#22201c']
/** Warm charcoal for dark mode (never pure black). */
const dark: MantineColorsTuple = ['#d6d3cc', '#b3afa6', '#8f8a80', '#69655c', '#4a4740', '#36342f', '#2a2925', '#211f1c', '#1a1916', '#121110']

export const theme = createTheme({
  primaryColor: 'forest',
  primaryShade: { light: 7, dark: 5 },
  colors: { forest, ink, clay, gray, dark },
  defaultRadius: 'sm',
  fontFamily: '"Geist Variable", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: { fontWeight: '600' },
  focusRing: 'auto',
  components: {
    Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
    Badge: Badge.extend({ defaultProps: { radius: 'sm', tt: 'none', fw: 500 } }),
    NavLink: NavLink.extend({ defaultProps: { variant: 'subtle' } }),
    Table: Table.extend({ defaultProps: { borderColor: 'var(--app-line)' } }),
  },
})

/** Warm off-white page with slightly lighter panels on top. */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#f6f5f1',
    '--mantine-color-default-border': '#e2dfd7',
    '--app-panel': '#fdfcfa',
    '--app-line': '#e8e5de',
  },
  dark: {
    '--mantine-color-body': '#1a1916',
    '--mantine-color-default-border': '#36342f',
    '--app-panel': '#211f1c',
    '--app-line': '#2f2d29',
  },
})
