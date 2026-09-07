import { defineConfig, devices } from '@playwright/test';

const IS_CI = !!process.env.CI;

// The browser projects share testDir with the unit specs and would otherwise
// collect them once per browser.
const E2E_ONLY = { testIgnore: '**/unit/**' } as const;

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
    // Headless by default; `--headed` on the command line overrides it.
    headless: true,
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

  // Chromium is the verified target. Agoda serves Firefox and WebKit a
  // different auto-suggest, so those are opt-in rather than part of a default
  // run — see "Supported browsers" in the README.
  projects: [
    { name: 'chromium', ...E2E_ONLY, use: { ...devices['Desktop Chrome'] } },
    ...(process.env.ALL_BROWSERS === '1'
      ? [
          { name: 'firefox', ...E2E_ONLY, use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', ...E2E_ONLY, use: { ...devices['Desktop Safari'] } },
        ]
      : []),

    // Pure helpers, so no browser, no retries and a short timeout.
    { name: 'unit', testDir: './tests/unit', retries: 0, timeout: 10 * 1000 },
  ],
});
