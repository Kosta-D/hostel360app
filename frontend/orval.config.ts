import { defineConfig } from 'orval'

// Regenerate the typed API client after backend changes: `npm run api:spec && npm run api`
export default defineConfig({
  hostel360: {
    input: './openapi.json',
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',
      httpClient: 'axios',
      override: { mutator: { path: 'src/api/http.ts', name: 'http' } },
    },
  },
})
