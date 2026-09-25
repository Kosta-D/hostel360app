const KEY = 'hostel360.token'

export const auth = {
  token: () => localStorage.getItem(KEY),
  set: (token: string) => localStorage.setItem(KEY, token),
  clear: () => localStorage.removeItem(KEY),
}
