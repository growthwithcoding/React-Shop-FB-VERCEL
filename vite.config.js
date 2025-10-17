import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    sourcemapIgnoreList: () => false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/demo/**',
        'seeding/**',
        '*.config.js',
        'server.js',
        'check-setup.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        // Set to false to warn instead of failing
        perFile: false,
        autoUpdate: false,
      },
      // Warn but don't fail on threshold violations
      thresholdAutoUpdate: false,
    },
  },
})
