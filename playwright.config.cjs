'use strict';

const { defineConfig } = require('@playwright/test');
const { PORT } = require('./tests/helpers/static-server.cjs');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  webServer: {
    command: 'node tests/helpers/static-server.cjs',
    port: PORT,
    reuseExistingServer: !process.env.CI
  },
  use: {
    baseURL: 'http://localhost:' + PORT
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
});
