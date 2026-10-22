import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto('http://localhost:5173');
await page.getByRole('heading', { name: 'The everyday essential', exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await mkdir('artifacts', { recursive: true });
await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await page.getByRole('heading', { name: 'The everyday essential', exact: true }).waitFor();
await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true, animations: 'disabled' });
console.log(
  JSON.stringify({
    errors,
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  })
);
await browser.close();
