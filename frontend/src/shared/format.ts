const formatters = new Map<string, Intl.NumberFormat>()

/** Formats an amount in any currency code; decimals follow the currency (e.g. RSD has none). */
export const money = (amount: number, currency = 'EUR') => {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency })
    formatters.set(currency, f)
  }
  return f.format(amount)
}
