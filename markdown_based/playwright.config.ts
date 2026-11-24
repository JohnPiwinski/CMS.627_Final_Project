import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'browser',
  use: {
    baseURL: 'http://localhost:5179',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run dev -- --port 5179',
    url: 'http://localhost:5179',
    reuseExistingServer: !process.env.CI,
  },
});
