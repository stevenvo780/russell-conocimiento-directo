import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home communicates the thesis and passes accessibility checks in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page).toHaveTitle(/arquitectura de lo ausente/i);
  await expect(page.getByRole('heading', { level: 1, name: /arquitectura/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /ver presentación/i })).toBeVisible();

  for (const theme of ['dark', 'light']) {
    await page.evaluate((value) => window.localStorage.setItem('russell-theme', value), theme);
    await page.reload();
    await page.waitForTimeout(250);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${theme} theme accessibility violations`).toEqual([]);
  }
});

test('presentation supports keyboard navigation, notes and index', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion');
  await expect(page.getByText(/Diapositiva 1:/)).toBeAttached();

  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/Diapositiva 2:/)).toBeAttached();
  await expect(page).toHaveURL(/#portada$/);

  await page.keyboard.press('s');
  const notes = page.getByRole('dialog', { name: /notas del ponente/i });
  await expect(notes).toBeVisible();
  await expect(notes.getByRole('button', { name: /cerrar panel/i })).toBeFocused();
  await page.waitForTimeout(500);
  const modalResults = await new AxeBuilder({ page }).analyze();
  expect(modalResults.violations, 'presentation dialog accessibility violations').toEqual([]);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/Diapositiva 2:/)).toBeAttached();
  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();

  const indexButton = page.getByRole('button', { name: /abrir índice/i });
  await indexButton.focus();
  await page.keyboard.press('Space');
  const index = page.getByRole('dialog', { name: /^índice$/i });
  await expect(index).toBeVisible();
  await expect(index.locator('.slide-index-grid button')).toHaveCount(14);
  await page.keyboard.press('Escape');
  await expect(indexButton).toBeFocused();
});

test('pages do not create global horizontal overflow', async ({ page }) => {
  for (const route of ['/', '/presentacion', '/fuentes']) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `overflow at ${route}`).toBeLessThanOrEqual(1);
  }
});

test('source page exposes the canonical Markdown guide', async ({ page }) => {
  await page.goto('/fuentes');
  const guide = page.getByRole('link', { name: /abrir capitulo5\.md/i });
  await expect(guide).toBeVisible();
  const href = await guide.getAttribute('href');
  expect(href).toMatch(/Capitulo5.*\.md/i);
});

test('every slide fits vertically in the presentation stage', async ({ page }) => {
  await page.goto('/presentacion');
  for (let slide = 0; slide < 14; slide += 1) {
    const metrics = await page.locator('.deck-slide').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(metrics.scrollHeight - metrics.clientHeight, `vertical overflow on slide ${slide + 1}`).toBeLessThanOrEqual(2);
    if (slide < 13) await page.keyboard.press('ArrowRight');
  }
});
