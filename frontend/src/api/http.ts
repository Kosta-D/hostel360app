import axios, { type AxiosRequestConfig } from 'axios'
import { auth } from '@/app/auth'

const client = axios.create()

client.interceptors.request.use((config) => {
  const token = auth.token()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
    auth.clear()
    window.location.assign('/login')
  }
  return Promise.reject(error)
})

/** Single HTTP entry point used by the generated API client. */
export const http = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
  client({ ...config, ...options }).then((r) => r.data)

/** Human-readable message from a problem+json error response. */
export const errorMessage = (error: unknown): string =>
  (axios.isAxiosError(error) && (error.response?.data?.detail as string)) || 'Something went wrong'
