import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: 'e2e/smoke.spec.ts',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npx vite preview --host 0.0.0.0 --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 10000,
  },
});