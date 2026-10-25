import { test, expect } from '@playwright/test';

test('adds existing library links to groups and moves or removes them without editing the link', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/links');
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Existing camera');
  await dialog.getByLabel('Affiliate URL').fill('https://example.com/camera?ref=creator');
  await dialog.getByRole('button', { name: 'Save to workspace' }).click();
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  for (const name of ['Cameras', 'Favorites']) {
    await dialog.getByLabel('Group name', { exact: true }).fill(name);
    await dialog.getByRole('button', { name: 'Create group', exact: true }).click();
    await expect(dialog.getByText(name, { exact: true })).toBeVisible();
  }
  const row = (name: string) =>
    dialog.locator('.group-row').filter({ has: page.getByText(name, { exact: true }) });
  await row('Cameras').getByRole('button', { name: 'Add / manage items', exact: true }).click();
  await dialog.getByRole('checkbox', { name: 'Existing camera Ungrouped', exact: true }).check();
  await dialog.getByRole('button', { name: 'Save group contents', exact: true }).click();
  await expect(row('Cameras').getByText('1 items', { exact: true })).toBeVisible();
  await row('Favorites').getByRole('button', { name: 'Add / manage items', exact: true }).click();
  await dialog.getByLabel('Search library', { exact: true }).fill('camera');
  await dialog.getByRole('checkbox', { name: 'Existing camera Cameras', exact: true }).check();
  await dialog.getByRole('button', { name: 'Save group contents', exact: true }).click();
  await expect(row('Cameras').getByText('0 items', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close groups' }).click();
  await page.getByLabel('Filter by group').selectOption({ label: 'Favorites' });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Existing camera', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  await row('Favorites').getByRole('button', { name: 'Add / manage items', exact: true }).click();
  await dialog.getByRole('checkbox', { name: 'Existing camera Favorites', exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Save group contents', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close groups' }).click();
  await page.getByLabel('Filter by group').selectOption('ungrouped');
  await expect(page.getByRole('heading', { name: 'Existing camera', exact: true })).toBeVisible();
});

test('mobile sheets drag down to dismiss while preserving scrolling, inputs and short gestures', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('heading', { name: 'The everyday essential', exact: true }).waitFor();
  const dialog = page.getByRole('dialog');
  const swipe = async (selector: string, distance: number, cancel = false) => {
    await dialog.evaluate(
      (node, { selector, distance, cancel }) => {
        const target = node.querySelector(selector)!;
        const bounds = target.getBoundingClientRect();
        const dispatch = (type: string, y: number) => {
          const touch = new Touch({ identifier: 1, target, clientX: bounds.x + 20, clientY: y });
          target.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
              changedTouches: [touch]
            })
          );
        };
        dispatch('touchstart', bounds.y + 10);
        dispatch('touchmove', bounds.y + 10 + distance);
        dispatch(cancel ? 'touchcancel' : 'touchend', bounds.y + 10 + distance);
      },
      { selector, distance, cancel }
    );
  };
  await page.getByRole('button', { name: 'Demo sign in', exact: true }).click();
  await swipe('.sheet-drag-handle', 25);
  await expect(dialog).toBeVisible();
  await swipe('.sheet-drag-handle', 170, true);
  await expect(dialog).toBeVisible();
  await swipe('input', 170);
  await expect(dialog).toBeVisible();
  await swipe('.sheet-drag-handle', 170);
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  await dialog.evaluate((node) => {
    node.style.maxHeight = '250px';
    node.scrollTop = 100;
  });
  await swipe('.modal-heading', 170);
  await expect(dialog).toBeVisible();
  await dialog.evaluate((node) => {
    node.scrollTop = 0;
  });
  await swipe('.sheet-drag-handle', 170);
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: /^The everyday essential Create/ }).click();
  await swipe('.sheet-drag-handle', 170);
  await expect(dialog).toHaveCount(0);
  await page.goto('/links');
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  await swipe('.sheet-drag-handle', 170);
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  await swipe('.modal-heading', 170);
  await expect(dialog).toBeVisible();
});

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

test('edit and delete links/prompts and manage separate library groups on mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/links');
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Group name', { exact: true }).fill('Home products');
  await dialog.getByRole('button', { name: 'Create group', exact: true }).click();
  await expect(dialog.getByText('Home products', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close groups' }).click();
  await page.getByLabel('Filter by group').selectOption({ label: 'Home products' });
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Grouped lamp');
  await dialog.getByLabel('Affiliate URL').fill('https://example.com/lamp?ref=creator');
  await dialog.getByLabel(/Preview image \(optional\)/).setInputFiles('static/icons/icon-192.png');
  await expect(dialog.getByRole('button', { name: 'Save to workspace' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Save to workspace' }).click();
  const card = page
    .locator('.item-card')
    .filter({ has: page.getByRole('heading', { name: 'Grouped lamp', exact: true }) });
  await expect(card.locator('img')).toBeVisible();
  const image = await card.locator('img').getAttribute('src');
  await card.getByRole('button', { name: /Grouped lamp https/ }).click();
  await page.getByRole('button', { name: 'Edit link', exact: true }).click();
  await expect(dialog.getByAltText('Current preview')).toBeVisible();
  await dialog.getByLabel('Title', { exact: true }).fill('Updated grouped lamp');
  await dialog
    .getByLabel('Affiliate URL')
    .fill('https://example.com/lamp?ref=creator&campaign=edited');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  const updated = page
    .locator('.item-card')
    .filter({ has: page.getByRole('heading', { name: 'Updated grouped lamp', exact: true }) });
  await expect(updated.locator('img')).toHaveAttribute('src', image!);
  await updated.getByRole('button', { name: 'Copy link', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'https://example.com/lamp?ref=creator&campaign=edited'
  );
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
  await dialog.getByLabel('Group name', { exact: true }).fill('Home essentials');
  await dialog.getByRole('button', { name: 'Rename group', exact: true }).click();
  await expect(dialog.getByText('Home essentials', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete group', exact: true }).click();
  await dialog.getByRole('button', { name: 'Confirm delete group', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close groups' }).click();
  await page.getByLabel('Filter by group').selectOption('ungrouped');
  await expect(updated).toBeVisible();
  await updated.getByRole('button', { name: /Updated grouped lamp https/ }).click();
  await page.getByRole('button', { name: 'Edit link', exact: true }).click();
  await dialog.getByRole('button', { name: 'Remove current image' }).click();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(updated.locator('img')).toHaveCount(0);
  await page.reload();
  await expect(updated).toBeVisible();

  await page.goto('/prompts');
  await page.getByRole('button', { name: 'Manage groups', exact: true }).click();
  await dialog.getByLabel('Group name', { exact: true }).fill('Visuals');
  await dialog.getByRole('button', { name: 'Create group', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close groups' }).click();
  await page.getByLabel('Filter by group').selectOption({ label: 'Visuals' });
  await page.getByRole('button', { name: 'Add prompt', exact: true }).click();
  await dialog.getByLabel('Title', { exact: true }).fill('Grouped prompt');
  await dialog.getByLabel('Prompt', { exact: true }).fill('Photo of [PRODUCT]');
  await dialog.getByRole('button', { name: 'Save to workspace' }).click();
  await page.getByRole('button', { name: /^Grouped prompt Photo/ }).click();
  await page.getByRole('button', { name: 'Edit prompt', exact: true }).click();
  await dialog.getByLabel('Title', { exact: true }).fill('Updated video prompt');
  await dialog
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('image-to-video');
  await dialog.getByLabel('Prompt', { exact: true }).fill('Animate [PRODUCT]');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await page.reload();
  await page.getByRole('button', { name: /^Updated video prompt Animate/ }).click();
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Updated video prompt' })).toHaveCount(0);
  await page.goto('/links');
  await expect(
    page.getByLabel('Filter by group').locator('option', { hasText: 'Visuals' })
  ).toHaveCount(0);
  await page.getByRole('button', { name: /Updated grouped lamp https/ }).click();
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(updated).toHaveCount(0);
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

test('install controls stay off desktop, work on mobile, and disappear in installed app windows', async ({
  browser,
  baseURL
}) => {
  const android =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36';
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      baseURL,
      ...(mobile ? { userAgent: android, isMobile: true, hasTouch: true } : {}),
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();
    await page.goto('/more');
    await expect(page.getByRole('heading', { name: 'Your workspace, your way.' })).toBeVisible();
    const button = page.getByRole('button', { name: /^Install app/ });
    await expect(button).toHaveCount(mobile ? 1 : 0);
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      Object.assign(event, {
        prompt: async () => {
          document.body.dataset.prompted = 'yes';
        },
        userChoice: Promise.resolve({ outcome: 'accepted' })
      });
      window.dispatchEvent(event);
    });
    if (mobile) {
      await button.click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Install app', exact: true })
        .click();
      await expect(button).toHaveCount(0);
      expect(await page.locator('body').getAttribute('data-prompted')).toBe('yes');
    }
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /^Install/ })).toHaveCount(0);
    await context.close();
  }
  const installed = await browser.newContext({
    baseURL,
    userAgent: android,
    isMobile: true,
    hasTouch: true
  });
  await installed.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = original(query);
      if (query === '(display-mode: standalone)')
        Object.defineProperty(result, 'matches', { value: true });
      return result;
    };
  });
  const app = await installed.newPage();
  await app.goto('/settings');
  await expect(app.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await expect(app.getByRole('button', { name: /^Install/ })).toHaveCount(0);
  await installed.close();
});

test('mobile install sheet appears automatically, remembers dismissal, and guides iPhone users', async ({
  browser,
  baseURL
}) => {
  const context = await browser.newContext({
    baseURL,
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto('/more');
  await expect(page.getByRole('button', { name: /^Install app/ })).toBeVisible();
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: 'accepted' })
    });
    window.dispatchEvent(event);
  });
  await page.getByRole('link', { name: 'Settings & setup', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Install Linkcraft' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Install app', exact: true })).toBeVisible();
  const box = await sheet.boundingBox();
  expect(Math.round(box!.x)).toBe(4);
  expect(Math.round(390 - box!.x - box!.width)).toBe(4);
  await sheet.getByRole('button', { name: 'Not now', exact: true }).click();
  await page.reload();
  await page.waitForTimeout(3000);
  await expect(sheet).toHaveCount(0);
  await context.close();

  const ios = await browser.newContext({
    baseURL,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 }
  });
  const iphone = await ios.newPage();
  await iphone.goto('/');
  const instructions = iphone.getByRole('dialog', { name: 'Install Linkcraft' });
  await expect(instructions).toBeVisible();
  await expect(instructions.getByText('Add to Home Screen', { exact: true })).toBeVisible();
  await expect(instructions.getByText('Share', { exact: true })).toBeVisible();
  await expect(instructions.getByRole('button', { name: 'Install app', exact: true })).toHaveCount(
    0
  );
  await iphone.mouse.click(195, 2);
  await expect(instructions).toHaveCount(0);
  await ios.close();
});

test('text inputs render markup as text and reject unsafe affiliate URLs', async ({ page }) => {
  await page.goto('/links');
  await page.getByRole('button', { name: 'Add affiliate link', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Title', { exact: true })).toHaveAttribute('maxlength', '120');
  await expect(dialog.getByLabel('Affiliate URL')).toHaveAttribute('maxlength', '12000');
  await dialog.getByLabel('Title', { exact: true }).fill('Unsafe link');
  await dialog.getByLabel('Affiliate URL').fill('https://user:password@example.com');
  await dialog.getByRole('button', { name: 'Save to workspace' }).click();
  await expect(dialog.getByRole('alert')).toContainText('embedded');
  await dialog.getByRole('button', { name: 'Prompt', exact: true }).click();
  const title = '<img src=x onerror="window.inputExecuted=true">';
  await dialog.getByLabel('Title', { exact: true }).fill(title);
  await dialog
    .getByLabel('Prompt', { exact: true })
    .fill('<script>window.inputExecuted=true</script>');
  await dialog.getByRole('button', { name: 'Save to workspace' }).click();
  await page.goto('/text-to-image');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  expect(await page.evaluate(() => 'inputExecuted' in window)).toBe(false);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
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
  expect((await request.get('/')).headers()['x-content-type-options']).toBe('nosniff');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await page.evaluate(() => fetch('/api/auth/get-session'));
  const cached = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const key of await caches.keys())
      for (const request of await (await caches.open(key)).keys())
        paths.push(new URL(request.url).pathname);
    return paths;
  });
  expect(cached).not.toContain('/api/auth/get-session');
  expect(cached).not.toContain('/');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A little pause.', exact: true })).toBeVisible();
  await context.setOffline(false);
});
