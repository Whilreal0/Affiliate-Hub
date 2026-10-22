import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.routeWebSocket('**/auth-test.convex.cloud/**', () => {});
  await page.route('https://auth-test.convex.cloud/**', (route) => route.abort());
});

test('refresh waits for session validation before showing Google sign-in', async ({ page }) => {
  let resolveSession: (() => void) | undefined;
  await page.route('**/api/auth/get-session**', async (route) => {
    await new Promise<void>((resolve) => {
      resolveSession = resolve;
    });
    await route.fulfill({ json: null });
  });
  for (const path of ['/', '/more', '/settings']) {
    resolveSession = undefined;
    await page.goto(path);
    await expect.poll(() => !!resolveSession).toBe(true);
    const checking = page.locator('.topbar').getByRole('button', { name: 'Checking session…' });
    await expect(checking).toBeDisabled();
    await expect(page.getByRole('button', { name: /Sign in/ })).toHaveCount(0);
    await expect(page.getByText('Guest', { exact: true })).toHaveCount(0);
    resolveSession!();
    await expect(
      page.locator('.topbar').getByRole('button', { name: 'Sign in with Google' })
    ).toBeEnabled();
  }
});

test('an existing session never shows sign-in while Convex reconnects after reload', async ({
  page
}) => {
  const now = new Date().toISOString();
  await page.route('**/api/auth/get-session**', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'test-user',
          name: 'Returning Creator',
          email: 'creator@example.com',
          emailVerified: true,
          createdAt: now,
          updatedAt: now
        },
        session: {
          id: 'test-session',
          userId: 'test-user',
          token: 'test-only',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: now,
          updatedAt: now
        }
      }
    })
  );
  // Keep token validation pending to simulate a slow reconnection without real credentials.
  await page.route('**/api/auth/convex/token**', () => {});
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await page.reload();
    else await page.goto('/more');
    await expect(page.locator('.menu-account strong')).toHaveText('Returning Creator');
    await expect(
      page.locator('.topbar').getByRole('button', { name: 'Checking session…' })
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: /Sign in/ })).toHaveCount(0);
    await expect(page.getByText('Guest', { exact: true })).toHaveCount(0);
  }
});

test('a verified cookie renders the account immediately and stays visible during background validation', async ({
  page,
  context
}) => {
  await context.addCookies([
    {
      name: 'better-auth.session_token',
      value: 'valid-session',
      url: 'http://localhost:4174',
      httpOnly: true
    }
  ]);
  const response = await page.request.get('/more');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const html = await response.text();
  expect(html).toContain('Returning Creator');
  expect(html).toContain('Sign out');
  expect(html).not.toContain('Checking session');
  expect(html).not.toContain('fixture-session-secret');
  expect(html).not.toContain('test-session');

  // Background auth requests intentionally remain pending throughout reloads.
  await page.route('**/api/auth/get-session**', () => {});
  await page.route('**/api/auth/convex/token**', () => {});
  await page.setViewportSize({ width: 390, height: 844 });
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await page.reload();
    else await page.goto('/more');
    await expect(page.locator('.menu-account strong')).toHaveText('Returning Creator');
    await expect(page.locator('.topbar').getByRole('button', { name: 'Sign out' })).toBeEnabled();
    await expect(page.getByText('Checking session…', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sign in/ })).toHaveCount(0);
  }
});

test('expired and invalid cookies cannot restore signed-in UI', async ({ page, context }) => {
  for (const cookie of ['expired-session', 'invalid-session']) {
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: cookie,
        url: 'http://localhost:4174',
        httpOnly: true
      }
    ]);
    const response = await page.request.get('/more');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain('Returning Creator');
    expect(html).not.toContain('Sign out');
    expect(html).not.toContain('fixture-session-secret');
  }
});
