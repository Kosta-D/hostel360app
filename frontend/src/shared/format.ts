const formatters = {
  EUR: new Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency: 'EUR' }),
  RSD: new Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency: 'RSD', maximumFractionDigits: 0 }),
}

export type CurrencyCode = keyof typeof formatters

export const money = (amount: number, currency: CurrencyCode = 'EUR') => formatters[currency].format(amount)
