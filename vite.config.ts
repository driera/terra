import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/terra/' : '/',
  plugins: [react()],
  ...(mode === 'test' && {
    define: { 'import.meta.env.VITE_MAPTILER_API_KEY': '"test-key"' },
  }),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/setupTests.ts'],
  },
}))
