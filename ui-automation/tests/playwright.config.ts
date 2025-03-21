import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30000,
  retries: 0,
  workers: undefined,
  reporter: "html",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
    {
      name: "firefox",
      use: {
        browserName: "firefox",
      },
    },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
      },
    },
  ],
  use: {
    headless: false,
    viewport: null,
    ignoreHTTPSErrors: true,
    video: "on-first-retry",
    trace: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 20000,

    launchOptions: {
      slowMo: 1000,
    },
  },
};

export default config;
