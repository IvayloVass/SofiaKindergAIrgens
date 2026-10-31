import { test, expect } from '@playwright/test';

test('shows the kindergarten cards from the source', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('9 резултата', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(9);
  await expect(page.getByRole('link', { name: 'ДГ №1 Червената шапчица (с яслени групи)' })).toBeVisible();
});

test('Cyrillic and Latin search find the same kindergarten', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Търсене на детска градина' });
  const karlson = page.getByRole('link', { name: 'ДГ №14 Карлсон (с яслени групи)' });

  await search.fill('Карлсон');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(karlson).toBeVisible();

  await search.fill('Karlson');
  await expect(page).toHaveURL(/\?q=Karlson$/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(karlson).toBeVisible();
});

test('the district filter narrows the list and survives a reload', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Люлин 3' }).click();
  await expect(page).toHaveURL(/\?regions=19$/);
  await expect(page.getByRole('article')).toHaveCount(3);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Люлин 3' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('article')).toHaveCount(3);
});
