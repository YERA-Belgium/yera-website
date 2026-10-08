import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  fullyParallel:true,
  use: {
    baseURL:process.env.PREVIEW_URL || 'http://localhost:4321',
    launchOptions:process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : undefined,
  },
});
