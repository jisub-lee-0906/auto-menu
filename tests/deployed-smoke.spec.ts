import { expect, test } from '@playwright/test';

test('deployed home page smoke test', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.url()} :: ${req.failure()?.errorText ?? 'unknown'}`);
  });

  await page.goto('https://auto-menu-app-omega.vercel.app/', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { level: 1, name: '오늘의 급식' })).toBeVisible();
  await expect(page.getByRole('button', { name: '전체 다시 짜기' })).toBeVisible();

  const searchButton = page.getByTitle('메뉴 검색');
  await expect(searchButton).toBeVisible();
  await searchButton.click();
  await expect(page.getByPlaceholder(/메뉴 검색/)).toBeVisible();
  await page.locator('div.fixed.inset-0.z-\\[100\\] button').click();
  await expect(page.getByPlaceholder(/메뉴 검색/)).toBeHidden();

  const generateButton = page.getByRole('button', { name: '전체 다시 짜기' });
  await generateButton.click();
  await expect(page.getByText('생성 중')).toBeVisible();
  await expect(generateButton).toBeVisible({ timeout: 3000 });

  const favoriteButton = page.getByTitle('즐겨찾기 저장');
  await favoriteButton.click();
  await expect(page.getByText('즐겨찾기에 저장했습니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '즐겨찾기' })).toBeVisible();

  const excludeButton = page.getByLabel('Exclude Item').first();
  await excludeButton.click();
  await expect(page.getByRole('heading', { name: /제외 메뉴/ })).toBeVisible();

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
  expect(failedRequests, `failed requests: ${failedRequests.join('\n')}`).toEqual([]);
});
