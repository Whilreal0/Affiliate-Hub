import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4173',
    browserName: 'chromium',
    permissions: ['clipboard-read', 'clipboard-write']
  },
  projects: [
    { name: 'demo', testMatch: 'workspace.spec.ts' },
    {
      name: 'cloud-auth',
      testMatch: 'auth-refresh.spec.ts',
      use: { baseURL: 'http://localhost:4174' }
    }
  ],
  webServer: [
    {
      command: 'node tests/fixtures/auth-server.mjs',
      url: 'http://127.0.0.1:4175/health',
      reuseExistingServer: false
    },
    {
      command: 'npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      // Browser tests exercise the demo without connecting to the live deployment.
      env: { PUBLIC_CONVEX_URL: '', PUBLIC_CONVEX_SITE_URL: '' }
    },
    {
      command: 'npm run preview -- --port 4174',
      url: 'http://localhost:4174',
      reuseExistingServer: false,
      // The auth tests intercept sessions and block this fictitious deployment.
      env: {
        PUBLIC_CONVEX_URL: 'https://auth-test.convex.cloud',
        PUBLIC_CONVEX_SITE_URL: 'http://127.0.0.1:4175'
      }
    }
  ],
  reporter: 'list'
});
