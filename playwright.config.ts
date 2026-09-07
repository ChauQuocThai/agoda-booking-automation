import { defineConfig, devices } from '@playwright/test';

const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 1,
  workers: IS_CI ? 2 : undefined,

  // Agoda is a heavy, ad-laden site behind a CDN; a full booking flow regularly
  // needs more than the 30s default before the payment page settles.
  timeout: 3 * 60 * 1000,
  expect: { timeout: 20 * 1000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    // Agoda ships its own hooks as data-element-name, so getByTestId() maps
    // straight onto them wherever a role or a label is not expressive enough.
    testIdAttribute: 'data-element-name',
    baseURL: 'https://www.agoda.com',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
    actionTimeout: 20 * 1000,
    navigationTimeout: 60 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
