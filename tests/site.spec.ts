import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home communicates the thesis and passes accessibility checks in both themes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page).toHaveTitle(/arquitectura de lo ausente/i);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { level: 1, name: /arquitectura/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /ver presentación/i })).toBeVisible();
  const headerPresentation = page.locator('.site-header').getByRole('link', { name: /presentar/i });
  await expect(headerPresentation).toBeVisible();
  expect((await headerPresentation.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.getByRole('progressbar', { name: /progreso de lectura/i })).toHaveAttribute('aria-valuetext', 'Presencia');
  await expect(page.getByRole('link', { name: /abrir el caso «la mesa»/i })).toHaveAttribute('href', /presentacion#mesa$/);
  await expect(page.getByRole('link', { name: /abrir el caso «el ganador»/i })).toHaveAttribute('href', /presentacion#ganador$/);
  await expect(page.getByRole('link', { name: /abrir el caso «bismarck»/i })).toHaveAttribute('href', /presentacion#bismarck$/);

  const directTab = page.getByRole('tab', { name: /conocimiento directo/i });
  const referenceTab = page.getByRole('tab', { name: /por referencia/i });
  await directTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(referenceTab).toBeFocused();
  await expect(referenceTab).toHaveAttribute('aria-selected', 'true');

  await page.goto('/#tesis');
  await expect(page.getByRole('heading', { name: /lo directo nos ancla/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

  for (const theme of ['dark', 'light']) {
    await page.evaluate((value) => window.localStorage.setItem('russell-theme', value), theme);
    await page.reload();
    await page.waitForTimeout(250);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${theme} theme accessibility violations`).toEqual([]);
  }
});

test('presentation supports keyboard navigation, presenter notes and a focus-trapped overview', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion');
  await expect(page.getByText(/Diapositiva 1 de 14:/)).toBeAttached();
  await expect(page).toHaveURL(/#pregunta$/);
  await expect(page.locator('.deck-progress')).toHaveAttribute('aria-valuenow', '1');

  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/Diapositiva 2 de 14:/)).toBeAttached();
  await expect(page).toHaveURL(/#portada$/);
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/#portada$/);
  await expect(page.locator('.deck-stage')).toHaveAttribute('data-reveal-step', '1');
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/#arquitectura$/);
  await page.keyboard.press('k');
  await expect(page).toHaveURL(/#portada$/);

  await page.keyboard.press('s');
  const notes = page.getByRole('dialog', { name: /notas del ponente/i });
  await expect(notes).toBeVisible();
  await expect(notes.getByRole('button', { name: /cerrar panel/i })).toBeFocused();
  await expect(notes.getByRole('heading', { name: /arquitectura de lo ausente/i })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#portada$/);
  await notes.getByRole('button', { name: /notas de la diapositiva siguiente/i }).click();
  await expect(page).toHaveURL(/#arquitectura$/);
  await expect(notes).toBeVisible();
  await expect(notes.getByText(/La presencia del color/i)).toBeVisible();
  const modalResults = await new AxeBuilder({ page }).analyze();
  expect(modalResults.violations, 'presentation dialog accessibility violations').toEqual([]);
  await page.keyboard.press('Escape');
  await expect(notes).toBeHidden();

  const indexButton = page.getByRole('button', { name: /abrir índice/i });
  await indexButton.focus();
  await page.keyboard.press('Space');
  const index = page.getByRole('dialog', { name: /^índice$/i });
  await expect(index).toBeVisible();
  await expect(index.locator('.slide-index-grid button')).toHaveCount(14);
  await expect(index.locator('[aria-current="step"]')).toHaveAttribute('aria-label', /dos formas de conocer/i);
  await page.keyboard.press('Shift+Tab');
  await expect(index.getByRole('button', { name: /respuesta a la pregunta inicial/i })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(index.getByRole('button', { name: /cerrar panel/i })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(indexButton).toBeFocused();
  expect(runtimeErrors).toEqual([]);
});

test('presenter tools expose semantic reveals, a laser pointer and a persistent session timer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion#arquitectura');

  const stage = page.locator('.deck-stage');
  await expect(stage).toHaveAttribute('data-act', 'anclaje');
  await expect(stage).toHaveAttribute('data-slide-variant', 'visual');

  const revealSequence = page.getByRole('list', { name: /secuencia de revelado/i });
  await expect(revealSequence.getByRole('button')).toHaveCount(3);
  const firstRevealTarget = await revealSequence.getByRole('button').first().boundingBox();
  expect(firstRevealTarget?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(firstRevealTarget?.height ?? 0).toBeGreaterThanOrEqual(44);
  await revealSequence.getByRole('button', { name: /paso 2 de 3: verdades y cosas/i }).click();
  await expect(stage).toHaveAttribute('data-reveal-step', '1');
  const visual = page.locator('.slide-visual');
  await expect(visual).toHaveAttribute('data-visual-stage', '1');
  await expect(visual).toHaveAttribute('data-semantic-threshold', '1');
  await expect(visual).toHaveAttribute('data-semantic-state', 'familias');
  await revealSequence.getByRole('button', { name: /paso 3 de 3: directo y por descripción/i }).click();
  await expect(stage).toHaveAttribute('data-reveal-step', '2');
  await expect(visual).toHaveAttribute('data-visual-stage', '2');
  await expect(visual).toHaveAttribute('data-semantic-threshold', '2');
  await expect(visual.getByRole('status')).toContainText(/etapa visual 2 de 2.*directo y por descripción/i);
  await expect(revealSequence.getByRole('button', { name: /paso 3 de 3/i })).toHaveAttribute('aria-current', 'step');

  const laserToggle = page.getByRole('button', { name: /activar puntero láser/i });
  await laserToggle.click();
  await expect(page.locator('.deck-shell')).toHaveAttribute('data-laser-enabled', 'true');
  await expect(laserToggle).toHaveAttribute('aria-pressed', 'true');
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  if (stageBox) {
    await stage.dispatchEvent('pointermove', {
      pointerType: 'mouse', pointerId: 31, isPrimary: true,
      clientX: stageBox.x + stageBox.width * 0.7,
      clientY: stageBox.y + stageBox.height * 0.36,
    });
  }
  await expect(stage).toHaveAttribute('data-laser-visible', 'true');
  await expect.poll(() => stage.evaluate((element) => element.style.getPropertyValue('--laser-x'))).toMatch(/%$/);
  await stage.focus();
  await page.keyboard.press('l');
  await expect(page.locator('.deck-shell')).toHaveAttribute('data-laser-enabled', 'false');
  await expect(page.getByRole('status').filter({ hasText: /puntero láser desactivado/i })).toBeAttached();

  await page.getByRole('button', { name: /abrir notas/i }).click();
  const notes = page.getByRole('dialog', { name: /notas del ponente/i });
  const timer = notes.locator('time');
  await expect(timer).toHaveText('00:00');
  await notes.getByRole('button', { name: 'Iniciar temporizador', exact: true }).click();
  await expect(timer).toHaveAttribute('data-running', 'true');
  await expect.poll(async () => timer.textContent(), { timeout: 3_000 }).not.toBe('00:00');
  await notes.getByRole('button', { name: /pausar temporizador/i }).click();
  await expect(timer).toHaveAttribute('data-running', 'false');
  const pausedTime = await timer.textContent();
  await page.waitForTimeout(400);
  await expect(timer).toHaveText(pausedTime ?? '');

  await notes.getByRole('button', { name: /aumentar tamaño/i }).click();
  await expect(notes.locator('.speaker-notes')).toHaveAttribute('data-note-scale', 'large');
  await notes.getByRole('button', { name: 'Reiniciar temporizador', exact: true }).click();
  await expect(timer).toHaveText('00:00');
});

test('every diagram follows its oral semantic stages and body content waits until the diagram is complete', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const plans = [
    { id: 'arquitectura', thresholds: [1, 2], labels: ['Verdades y cosas', 'Directo y por descripción'], revealMax: 2 },
    { id: 'mesa', thresholds: [2, 3, 5], labels: ['Datos sensoriales', 'Verdad puente', 'Objeto físico descrito'], revealMax: 3 },
    { id: 'inventario', thresholds: [2, 4, 5], labels: ['Sensación y memoria', 'Introspección y universales', 'El yo: tesis probable'], revealMax: 3 },
    { id: 'yo', thresholds: [1, 3, 4], labels: ['El sujeto problemático', 'Acto mental y dato sensorial', 'Límite: no un yo permanente'], revealMax: 3 },
    { id: 'descripcion', thresholds: [1, 2, 3], labels: ['¿Existe algún F?', '¿Es el único F?', 'Referencia o fracaso'], revealMax: 4 },
    { id: 'ganador', thresholds: [1, 2, 3], labels: ['Candidatos conocidos', 'La descripción «el ganador»', 'Identidad todavía ignorada'], revealMax: 3 },
    { id: 'bismarck', thresholds: [1, 3, 5], labels: ['Presentación posible', 'Mediación testimonial', 'Conocimiento solo descriptivo'], revealMax: 3 },
    { id: 'respuesta', thresholds: [1, 2, 4], labels: ['Directo: términos presentes', 'Verdades de enlace', 'Referencia: alcance ampliado'], revealMax: 3 },
  ];

  for (const plan of plans) {
    await page.goto(`/presentacion#${plan.id}`);
    const stage = page.locator('.deck-stage');
    await expect(stage).toHaveAttribute('data-reveal-max', String(plan.revealMax));
    for (let semanticStage = 0; semanticStage < plan.thresholds.length; semanticStage += 1) {
      await page.keyboard.press('ArrowRight');
      const visual = page.locator('.slide-visual');
      await expect(visual).toHaveAttribute('data-visual-stage', String(semanticStage + 1));
      await expect(visual).toHaveAttribute('data-visual-stage-max', String(plan.thresholds.length));
      await expect(visual).toHaveAttribute('data-semantic-threshold', String(plan.thresholds[semanticStage]));
      await expect(visual).toHaveAttribute('aria-label', new RegExp(plan.labels[semanticStage].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

      if (plan.id === 'yo') {
        const conclusion = visual.locator('.conclusion-node');
        await expect(conclusion).toHaveCount(1);
        await expect.poll(async () => Number(await conclusion.evaluate((element) => getComputedStyle(element).opacity))).toBe(
          semanticStage === plan.thresholds.length - 1 ? 1 : 0,
        );
      }
    }

    if (plan.id === 'mesa') {
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('.slide-visual')).toHaveAttribute('data-visual-stage', '2');
      await expect(page.locator('.slide-visual')).toHaveAttribute('data-semantic-threshold', '3');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('.slide-visual')).toHaveAttribute('data-visual-stage', '3');
    }

    if (plan.id === 'descripcion') {
      await expect(page.locator('.logic-formula')).toHaveCount(0);
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('.logic-formula')).toBeAttached();
      await expect(page.locator('.deck-stage')).toHaveAttribute('data-reveal-step', '4');
      await expect(page.locator('.slide-visual')).toHaveAttribute('data-visual-stage', '3');
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('.logic-formula')).toHaveCount(0);
      await expect(page.locator('.slide-visual')).toHaveAttribute('data-visual-stage', '3');
    }
  }
});

test('motion uses a compact profile on narrow or coarse devices and yields to reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/presentacion#arquitectura');
  const shell = page.locator('.deck-shell');
  const compactExpected = await page.evaluate(() => window.matchMedia('(max-width: 680px), (pointer: coarse)').matches);
  await expect(shell).toHaveAttribute('data-motion-profile', compactExpected ? 'compact' : 'spatial');
  const duration = Number(await shell.getAttribute('data-slide-transition-ms'));
  if (compactExpected) expect(duration).toBeLessThanOrEqual(350);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(shell).toHaveAttribute('data-motion-profile', 'reduced');
  await expect(shell).toHaveAttribute('data-slide-transition-ms', '10');
});

test('deep links, browser history and overview selection preserve the exact slide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion#bismarck');

  const stage = page.locator('.deck-stage');
  await expect(stage).toHaveAttribute('aria-label', /Diapositiva 11 de 14.*Bismarck/i);
  await expect(page.locator('.deck-progress')).toHaveAttribute('aria-valuenow', '11');

  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#bismarck$/);
  await expect(stage).toHaveAttribute('data-reveal-step', '1');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#bismarck$/);
  await expect(stage).toHaveAttribute('data-reveal-step', '2');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#bismarck$/);
  await expect(stage).toHaveAttribute('data-reveal-step', '3');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#principio$/);
  await expect(stage).toHaveAttribute('data-transition', 'act-forward');
  await expect(stage).toHaveAttribute('data-act', 'alcance');
  await page.evaluate(() => window.history.back());
  await expect(page).toHaveURL(/#bismarck$/);
  await expect(stage).toHaveAttribute('aria-label', /Diapositiva 11 de 14/i);
  await expect(stage).toHaveAttribute('data-transition', 'act-backward');
  await page.evaluate(() => window.history.forward());
  await expect(page).toHaveURL(/#principio$/);

  await page.getByRole('button', { name: /abrir índice/i }).click();
  const overview = page.getByRole('dialog', { name: /^índice$/i });
  await overview.getByRole('button', { name: /ir a la diapositiva 5.*experimento de la mesa/i }).click();
  await expect(page).toHaveURL(/#mesa$/);
  await expect(stage).toBeFocused();
  await page.reload();
  await expect(stage).toHaveAttribute('aria-label', /Diapositiva 5 de 14.*mesa/i);
});

test('invalid slide hashes recover to the opening question', async ({ page }) => {
  await page.goto('/presentacion#una-diapositiva-inexistente');
  await expect(page).toHaveURL(/#pregunta$/);
  await expect(page.locator('.deck-progress')).toHaveAttribute('aria-valuenow', '1');
});

test('touch gestures navigate horizontally while preserving vertical and diagram gestures', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion#pregunta');
  const shell = page.locator('.deck-shell');
  const box = await shell.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await shell.dispatchEvent('pointerdown', {
    pointerType: 'touch', pointerId: 7, isPrimary: true,
    clientX: box.x + box.width * 0.82, clientY: box.y + box.height * 0.52,
  });
  await shell.dispatchEvent('pointerup', {
    pointerType: 'touch', pointerId: 7, isPrimary: true,
    clientX: box.x + box.width * 0.18, clientY: box.y + box.height * 0.5,
  });
  await expect(page).toHaveURL(/#portada$/);

  await shell.dispatchEvent('pointerdown', {
    pointerType: 'touch', pointerId: 8, isPrimary: true,
    clientX: box.x + box.width * 0.5, clientY: box.y + box.height * 0.8,
  });
  await shell.dispatchEvent('pointerup', {
    pointerType: 'touch', pointerId: 8, isPrimary: true,
    clientX: box.x + box.width * 0.48, clientY: box.y + box.height * 0.2,
  });
  await expect(page).toHaveURL(/#portada$/);

  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#portada$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#arquitectura$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#arquitectura$/);
  const diagram = page.locator('.slide-visual[role="region"]');
  await diagram.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#arquitectura$/);
  await expect(page.locator('.deck-stage')).toHaveAttribute('data-reveal-step', '2');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#color$/);
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
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/presentacion');
  for (let slide = 0; slide < 14; slide += 1) {
    const stage = page.locator('.deck-stage');
    const revealMax = Number(await stage.getAttribute('data-reveal-max'));
    for (let reveal = 0; reveal < revealMax; reveal += 1) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(stage).toHaveAttribute('data-reveal-step', String(revealMax));
    const metrics = await page.locator('.deck-slide').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(metrics.scrollHeight - metrics.clientHeight, `vertical overflow on slide ${slide + 1}`).toBeLessThanOrEqual(2);

    const visual = page.locator('.deck-slide .slide-visual .concept-visual:visible').last();
    const currentSlideId = await stage.getAttribute('data-slide-id');
    const mobileDiagramSlides = ['arquitectura', 'mesa', 'inventario', 'yo', 'descripcion', 'ganador', 'bismarck', 'respuesta'];
    if ((page.viewportSize()?.width ?? 0) <= 640 && currentSlideId && mobileDiagramSlides.includes(currentSlideId)) {
      await expect(visual).toBeVisible();
      await expect(visual).toHaveClass(/is-mobile-layout/);
      await expect(visual).toHaveAttribute('data-layout', /^mobile-/);
      const [visualBox, stageBox] = await Promise.all([visual.boundingBox(), stage.boundingBox()]);
      expect(visualBox, `missing visual bounds on slide ${slide + 1}`).not.toBeNull();
      expect(stageBox, `missing stage bounds on slide ${slide + 1}`).not.toBeNull();
      if (visualBox && stageBox) {
        expect(visualBox.x, `visual starts outside slide ${slide + 1}`).toBeGreaterThanOrEqual(stageBox.x - 1);
        expect(visualBox.x + visualBox.width, `visual ends outside slide ${slide + 1}`).toBeLessThanOrEqual(stageBox.x + stageBox.width + 1);
      }
    }
    if (slide < 13) await page.keyboard.press('ArrowRight');
  }
});
