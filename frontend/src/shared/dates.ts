import dayjs from 'dayjs'

export const ISO = 'YYYY-MM-DD'
export const today = () => dayjs().format(ISO)
export const fmtDate = (d: string) => dayjs(d).format('D.M.YYYY')
export const fmtMonth = (d: string) => dayjs(d).format('MMM YYYY')
export const addDays = (d: string, n: number) => dayjs(d).add(n, 'day').format(ISO)
export const diffDays = (a: string, b: string) => dayjs(b).diff(dayjs(a), 'day')
