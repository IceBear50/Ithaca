import { test, expect } from '@playwright/test';

test('Ithaca smoke test', async ({ page }) => {
  const response = await page.goto('http://localhost:4173/', { waitUntil: 'networkidle', timeout: 15000 });
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/Ithaca/, { timeout: 5000 });
  // App may redirect to login (unauthenticated) - just verify no crash
  await page.waitForLoadState('domcontentloaded');
  const body = page.locator('body');
  await expect(body).not.toContainText(/error|failed|cannot|not found|something went wrong|Uncaught/i);
  // Take a screenshot for reference
  await page.screenshot({ path: 'test-results/smoke.png', fullPage: true });
});