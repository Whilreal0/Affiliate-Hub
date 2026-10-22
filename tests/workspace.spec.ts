import { test, expect } from '@playwright/test';

test('mobile sheets close on outside taps and preserve clicks inside', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('heading', { name: 'The everyday essential', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Email', { exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(195, 2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Unsaved test link');
  await page.mouse.click(1, 800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /^The everyday essential Create/ }).click();
  await page
    .getByRole('dialog')
    .getByText('Private — only in your workspace', { exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(195, 2);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('super admin preview is restricted, persists across reload, and supports searching users on mobile', async ({
  page
}) => {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Super admin sign-in required.', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).first().click();
  await page.getByRole('button', { name: 'Fill demo credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Super admin access required.', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).first().click();
  await page.getByRole('button', { name: 'Fill admin credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Built-in demo accounts' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'admin@linkcraft.test', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'demo@linkcraft.test', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search registered users' }).fill('creator');
  await expect(page.getByRole('cell', { name: 'demo@linkcraft.test', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'admin@linkcraft.test', exact: true })).toHaveCount(
    0
  );
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole('navigation', { name: 'Mobile navigation' })
    .getByRole('link', { name: 'More', exact: true })
    .click();
  await page
    .getByRole('region', { name: 'Workspace options' })
    .getByRole('link', { name: 'Super admin', exact: true })
    .click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('publish links and prompts, browse signed out, then withdraw a post', async ({ page }) => {
  await page.goto('/community');
  await expect(
    page.getByRole('heading', { name: 'Good ideas are worth sharing.', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Demo Community feed:', { exact: false })).toBeVisible();
  // Public browsing is available before sign-in; publishing prompts for login.
  await page.getByRole('button', { name: 'Create public post', exact: true }).first().click();
  await page.getByRole('button', { name: 'Fill demo credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: 'Create public post', exact: true }).first().click();
  await page.getByRole('button', { name: 'Affiliate link', exact: true }).click();
  await expect(page.getByLabel('Category', { exact: true })).toHaveCount(0);
  await page.getByLabel('Title', { exact: true }).fill('Community desk lamp');
  await page.getByLabel('Affiliate URL').fill('https://example.com/lamp?ref=demo');
  await page.getByRole('button', { name: 'Publish post', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Community desk lamp', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Create public post', exact: true }).click();
  await page.getByRole('button', { name: 'Prompt', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Community product photo');
  await page
    .getByLabel('Prompt', { exact: true })
    .fill('Photograph [PRODUCT] in soft morning light.');
  await page.getByRole('button', { name: 'Publish post', exact: true }).click();
  await page.getByRole('button', { name: 'Links', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Community desk lamp', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Community product photo', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Image prompts', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Community product photo', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'All posts', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Community desk lamp', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: /Community desk lamp https/ }).click();
  await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Make private', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close detail', exact: true }).click();
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Fill demo credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: /Community desk lamp https/ }).click();
  await page.getByRole('button', { name: 'Make private', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Community desk lamp', exact: true })).toHaveCount(
    0
  );
  await page.getByRole('button', { name: /^Affiliate links/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Community desk lamp', exact: true })
  ).toBeVisible();
});

test('dummy login validates credentials, survives reload, and signs out', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('wrong@example.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Use the demo email and password shown above.');
  await page.getByRole('button', { name: 'Fill demo credentials', exact: true }).click();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('complementary')).toContainText('Demo Creator');
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Demo sign in', exact: true })).toBeVisible();
});

test('affiliate URL round trip, copy, persistence, favorite, and deletion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  await expect(page.getByLabel('Category', { exact: true })).toHaveCount(0);
  await page.getByLabel('Title', { exact: true }).fill('My desk lamp');
  await page
    .getByLabel('Affiliate URL')
    .fill('https://example.com/lamp?ref=creator&campaign=october');
  await page.getByRole('button', { name: 'Save to workspace' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /^Affiliate links/ }).click();
  await expect(page.getByLabel('Filter by category', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'My desk lamp', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://example.com/lamp?ref=creator&campaign=october'
  );
  await page.getByRole('button', { name: 'Favorite My desk lamp', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Unfavorite My desk lamp', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: /^Affiliate links/ }).click();
  await expect(page.getByRole('heading', { name: 'My desk lamp', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /My desk lamp https/ }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My desk lamp', exact: true })).toHaveCount(0);
});

test('affiliate preview converts to small WebP, survives reload, and copies the complete tracking link', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/links');
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  await page.getByLabel('Title', { exact: true }).fill('Preview product');
  const url = 'https://example.com/product?affiliate=creator&campaign=image-test';
  await page.getByLabel('Affiliate URL').fill(url);
  const picker = page.getByLabel(/Preview image \(optional\)/);
  await picker.setInputFiles({
    name: 'unsafe.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg></svg>')
  });
  await expect(page.getByRole('alert')).toContainText('Choose a JPG');
  await expect(page.getByRole('button', { name: 'Save to workspace' })).toBeDisabled();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#2563eb');
    gradient.addColorStop(1, '#f0f4ff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 800);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await picker.setInputFiles({
    name: 'product.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64')
  });
  await expect(page.getByAltText('Selected preview')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save to workspace' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save to workspace' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const card = page
    .locator('.item-card')
    .filter({ has: page.getByRole('heading', { name: 'Preview product', exact: true }) });
  const thumbnail = card.locator('img');
  await expect(thumbnail).toBeVisible();
  const src = (await thumbnail.getAttribute('src'))!;
  expect(src).toMatch(/^data:image\/webp;base64,/);
  const bytes = Buffer.from(src.split(',')[1], 'base64');
  expect(bytes.length).toBeLessThanOrEqual(100 * 1024);
  expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
  await expect
    .poll(() => thumbnail.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBe(640);
  await card.getByRole('button', { name: 'Copy link', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(url);
  await page.reload();
  await expect(thumbnail).toBeVisible();
  expect(await thumbnail.getAttribute('src')).toBe(src);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('separate prompt menus, search and accessible dialog dismissal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Image to video', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The slow reveal', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The everyday essential', exact: true })
  ).toHaveCount(0);
  await page.getByLabel('Search library').fill('cinematic');
  await expect(
    page.getByRole('heading', { name: 'The cinematic orbit', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The slow reveal', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Add prompt', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mobile layout has no horizontal overflow and navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your creative home base.', exact: true })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(mobileNav).toBeVisible();
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mobileNav.getByRole('link', { name: 'Prompts', exact: true }).click();
  await expect(page).toHaveURL(/\/prompts$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Text to image', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Start with a great image.', exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The everyday essential', exact: true })
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/prompts$/);
  await expect(
    page.getByRole('heading', { name: 'Your prompt library.', exact: true })
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/text-to-image$/);
  await mobileNav.getByRole('link', { name: 'Community', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Good ideas are worth sharing.', exact: true })
  ).toBeVisible();
  await mobileNav.getByRole('link', { name: 'Links', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Every link. Ready to share.', exact: true })
  ).toBeVisible();
  await mobileNav.getByRole('link', { name: 'More', exact: true }).click();
  const morePage = page.getByRole('region', { name: 'Workspace options' });
  await expect(page).toHaveURL(/\/more$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(morePage).toBeVisible();
  await page.reload();
  await expect(morePage).toBeVisible();
  await expect(morePage.getByRole('link', { name: 'Super admin', exact: true })).toHaveCount(0);
  await morePage.getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your go-to collection.', exact: true })
  ).toBeVisible();
  await mobileNav.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your creative home base.', exact: true })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('PWA assets, offline fallback, and unconfigured auth response', async ({
  page,
  context,
  request
}) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe('standalone');
  expect((await request.get('/icons/icon-192.png')).ok()).toBe(true);
  expect((await request.get('/api/auth/get-session')).status()).toBe(503);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A little pause.', exact: true })).toBeVisible();
  await context.setOffline(false);
});
