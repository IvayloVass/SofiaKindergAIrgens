import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('the Excel button downloads an .xlsx workbook', async ({ page }) => {
  await page.goto('/kindergarten/171');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Изтегли като Excel' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const file = await readFile(await download.path());
  expect(file.subarray(0, 2).toString('latin1')).toBe('PK');
});

test('the PDF button downloads a .pdf document', async ({ page }) => {
  await page.goto('/kindergarten/171');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Изтегли като PDF' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const file = await readFile(await download.path());
  expect(file.subarray(0, 5).toString('latin1')).toBe('%PDF-');
});
