import { test, expect } from '@playwright/test';

test('a card opens the detail page and the back button returns to the list', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'ДГ №1 Червената шапчица (с яслени групи)' }).click();
  await expect(page).toHaveURL(/\/kindergarten\/171$/);
  await expect(page.getByRole('heading', { level: 1, name: 'ДГ №1 Червената шапчица (с яслени групи)' })).toBeVisible();
  await expect(page.getByText('Места общо')).toBeVisible();
  await expect(page.getByText('Записани деца')).toBeVisible();

  await page.getByRole('button', { name: 'Всички градини' }).click();
  await expect(page).toHaveURL(/localhost:4173\/$/);
  await expect(page.getByRole('article')).toHaveCount(9);
});

test('finds a child in the waiting list by application number', async ({ page }) => {
  await page.goto('/kindergarten/171');

  await page.getByRole('searchbox', { name: 'Входящ номер на детето' }).fill('24018148');
  await expect(page.getByRole('status')).toContainText('Входящ № 24018148 е на 1. място');
});

test('an unknown id shows the not-found state', async ({ page }) => {
  await page.goto('/kindergarten/999999');

  await expect(page.getByRole('heading', { name: 'Няма такава детска градина' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Към всички градини' })).toBeVisible();
});
