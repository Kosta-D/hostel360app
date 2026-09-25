import type { ExpenseCategory } from '@/api/generated'

export const CATEGORY: Record<ExpenseCategory, string> = {
  CLEANING: 'Cleaning & supplies',
  LAUNDRY: 'Laundry',
  REPAIRS: 'Repairs',
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  HEATING: 'Heating / gas',
  INTERNET: 'Internet / TV',
  GARBAGE: 'Garbage / communal',
  STAFF: 'Staff / help',
  TAXES: 'Taxes & fees',
  EQUIPMENT: 'Equipment',
  OTHER: 'Other',
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY).map(([value, label]) => ({ value, label }))

/** Chart series colors (validated categorical slots 1 and 2), stepped for light and dark mode. */
export const SERIES = {
  income: 'light-dark(#2a78d6, #3987e5)',
  costs: 'light-dark(#eb6834, #d95926)',
}
