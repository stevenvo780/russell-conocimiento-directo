import { expect, test } from '@playwright/test';

/*
  Motion contract of the deck (brief §9).

  - With motion allowed, a reveal step walks the newly unlocked stage in: the node
    reaches opacity 1 within 1.5 s and, 2.5 s later, nothing runs on the stage
    except the allowed loops (≤ 4 at rest).
  - An open overlay flips the budget to 'off' and pauses every loop.
  - Under prefers-reduced-motion nothing animates after a navigation.
*/

const ALLOWED_LOOPS = new Set(['edge-pulse', 'semantic-breathe', 'uncertainty-signal']);

type AnimationSnapshot = { name: string; state: string; duration: number };

async function stageAnimations(page: import('@playwright/test').Page): Promise<AnimationSnapshot[]> {
  return page.evaluate(() => {
    const stage = document.querySelector('.deck-stage');
    if (!stage) return [];
    return stage.getAnimations({ subtree: true }).map((animation) => {
      const timing = animation.effect?.getComputedTiming();
      const duration = typeof timing?.duration === 'number' ? timing.duration : Number(timing?.duration ?? 0);
      const named = animation as Animation & { animationName?: string; transitionProperty?: string };
      return {
        name: named.animationName ?? named.transitionProperty ?? animation.id ?? 'animation',
        state: animation.playState,
        duration,
      };
    });
  });
}

async function settled(page: import('@playwright/test').Page) {
  await expect(page.locator('.deck-shell')).toHaveAttribute('data-deck-transitioning', 'false', { timeout: 10_000 });
}

test.describe('motion', () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium' || browserName !== 'chromium', 'Desktop motion gate');
  });

  test('a reveal step walks the new stage in and the stage settles to its allowed loops', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/presentacion#mesa');
    const stage = page.locator('.deck-stage');
    await expect(stage).toHaveAttribute('data-slide-id', 'mesa');
    await expect(page.locator('.deck-shell')).toHaveAttribute('data-motion-profile', 'spatial');
    await settled(page);

    // Step 1 unlocks stages 1 and 2 (threshold 2); step 2 unlocks stage 3.
    for (const [step, unlockedStage] of [[1, '2'], [2, '3']] as const) {
      await page.keyboard.press('ArrowRight');
      await expect(stage).toHaveAttribute('data-reveal-step', String(step));
      const node = page.locator(`.slide-visual .semantic-node[data-stage='${unlockedStage}']`).first();
      await expect(node).toHaveAttribute('data-stage-role', 'active');
      await expect
        .poll(() => node.evaluate((element) => Number(getComputedStyle(element).opacity)), { timeout: 1500 })
        .toBe(1);
    }

    await page.waitForTimeout(2500);
    const animations = await stageAnimations(page);
    const running = animations.filter((animation) => animation.state === 'running');
    const foreign = running.filter((animation) => !ALLOWED_LOOPS.has(animation.name));
    expect(foreign, `unexpected animations at rest: ${JSON.stringify(foreign)}`).toEqual([]);
    expect(running.length, 'loops at rest').toBeLessThanOrEqual(4);

    // The past stage is dimmed, the active one is not.
    const pastOpacity = await page
      .locator(".slide-visual .semantic-node[data-stage-role='past'] > .node-surface")
      .first()
      .evaluate((element) => Number(getComputedStyle(element).opacity));
    expect(pastOpacity).toBeLessThan(1);

    // An open overlay stops every loop.
    await page.keyboard.press('i');
    await expect(page.locator('.deck-shell')).toHaveAttribute('data-motion-budget', 'off');
    await expect
      .poll(async () => (await stageAnimations(page)).filter((animation) => animation.state === 'running').length)
      .toBe(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.deck-shell')).toHaveAttribute('data-motion-budget', /active|idle/);
  });

  test('a slide re-entered backward lands complete with its past stages dimmed and no walk', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/presentacion#inventario');
    await expect(page.locator('.deck-stage')).toHaveAttribute('data-slide-id', 'inventario');
    await settled(page);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.deck-stage')).toHaveAttribute('data-slide-id', 'mesa');
    const visual = page.locator('.slide-visual');
    await expect(visual).toHaveAttribute('data-visual-stage', '3');
    await expect(visual).toHaveAttribute('data-arrival', 'scripted', { timeout: 5_000 });
    await expect(visual.locator(".semantic-node[data-stage='5']").first()).toHaveAttribute('data-stage-role', 'active');
    await expect(visual.locator(".semantic-node[data-stage='1']").first()).toHaveAttribute('data-stage-role', 'past');
    const arrivals = await page.evaluate(() =>
      document.querySelector('.slide-visual')?.getAnimations({ subtree: true }).filter((animation) => animation.id.startsWith('arrival')).length ?? 0,
    );
    expect(arrivals).toBe(0);
  });

  test('reduced motion yields no animation after a navigation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/presentacion#mesa');
    const shell = page.locator('.deck-shell');
    await expect(shell).toHaveAttribute('data-motion-profile', 'reduced');
    await expect(shell).toHaveAttribute('data-slide-transition-ms', '10');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.deck-stage')).toHaveAttribute('data-reveal-step', '1');
    const immediate = await stageAnimations(page);
    const slow = immediate.filter((animation) => animation.duration > 10);
    expect(slow, `animations longer than the reduced budget: ${JSON.stringify(slow)}`).toEqual([]);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.deck-stage')).toHaveAttribute('data-reveal-step', '3');
    await page.waitForTimeout(200);
    const later = await stageAnimations(page);
    expect(later.filter((animation) => animation.state === 'running'), 'running animations under reduce').toEqual([]);
    await expect(page.locator(".slide-visual .semantic-node[data-stage='5']").first()).toHaveCSS('opacity', '1');
  });
});
