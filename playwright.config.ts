import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '.git/verification/playwright',
  testIgnore: '**/deployed-smoke.spec.ts',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  projects: [
    { name: 'logic', testMatch: /(?:catalog|generator|planner|workspace)\.spec\.ts/ },
    { name: 'desktop', testMatch: '**/editor.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, baseURL: 'http://127.0.0.1:3100' } },
    { name: 'mobile', testMatch: '**/editor.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, baseURL: 'http://127.0.0.1:3100' } },
  ],
  use: { screenshot: 'only-on-failure', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } },
});
