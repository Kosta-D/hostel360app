const formatters = new Map<string, Intl.NumberFormat>()
let primary = 'EUR'

/** The primary currency from Settings; every total is in it. Set by the layout once settings load. */
export const primaryCurrency = () => primary
export const setPrimaryCurrency = (code: string) => { primary = code }

/** Formats an amount (in the primary currency unless given); decimals follow the currency, e.g. RSD has none. */
export const money = (amount: number, currency = primary) => {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('sr-Latn-RS', { style: 'currency', currency })
    formatters.set(currency, f)
  }
  return f.format(amount)
}
