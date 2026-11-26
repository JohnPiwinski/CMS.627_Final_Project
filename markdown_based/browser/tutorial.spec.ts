import { expect, test, type Page } from '@playwright/test';

async function sceneCenter(page: Page) {
  const box = await page.locator('.scene').boundingBox();
  if (!box) throw new Error('Scene is missing');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

async function chooseTool(page: Page, index: number) {
  await page.getByRole('toolbar', { name: /Transformation tools/ }).locator('canvas')
    .click({ position: { x: 31 + 54 * index, y: 62 } });
}

async function unlockLattices(page: Page) {
  await page.addInitScript(() => localStorage.setItem('markdown-based:chapter-zero:v1',
    JSON.stringify({ completed: ['square-lattice:matched'], visited: [] })));
}

async function drag(page: Page, x: number, y: number, dx: number, dy: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

async function turnLattice(page: Page, degrees: number, offset = 0) {
  const center = await sceneCenter(page);
  const x = center.x + offset;
  const y = center.y;
  await page.mouse.click(x, y);
  await page.mouse.move(x + 42, y);
  await page.mouse.down();
  for (let step = 1; step <= 8; step++) {
    const angle = degrees * Math.PI / 180 * step / 8;
    await page.mouse.move(x + 42 * Math.cos(angle), y - 42 * Math.sin(angle));
  }
  await page.mouse.up();
}

test('plays the M2 asset and advances the tutorial when playback ends', async ({ page }) => {
  await page.goto('/2');
  await page.getByRole('button', { name: 'Transcript' }).click();
  await expect(page.locator('.transcript')).toContainText('Welcome to Chapter Zero');
  const audio = page.locator('audio');
  await expect(audio).toHaveAttribute('src', /square-intro-.*\.mp3$/);
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause voiceover' })).toBeVisible();
  await expect.poll(() => audio.evaluate(node => (node as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause voiceover' }).click();
  await audio.evaluate(node => {
    const clip = node as HTMLAudioElement;
    clip.currentTime = clip.duration - 0.3;
  });
  await page.getByRole('button', { name: 'Play voiceover' }).click();
  await expect(page.getByRole('toolbar')).toHaveAccessibleName(/Translate, Rotate, Reflect/);
  await expect(page.locator('audio')).toHaveAttribute('src', /square-translate-.*\.mp3$/);
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('requires a labeled triangle match to unlock later tutorial sections', async ({ page }) => {
  await page.goto('/3');
  await expect(page.getByRole('heading', { name: 'Square lattice' })).toBeVisible();
  const next = page.getByRole('button', { name: 'Eisenstein lattice' });
  await expect(next).toBeDisabled();
  const dock = page.getByRole('toolbar');
  await expect(dock).toHaveAccessibleName(/Translate, Rotate, Reflect/);
  await page.getByRole('button', { name: 'Continue' }).click();
  const stage = await page.locator('.scene .konvajs-content').elementHandle();
  const { x, y, box } = await sceneCenter(page);
  const unit = Math.max(29, Math.min(47, Math.min(box.width / 14.6, box.height / 9.1)));
  await dock.press('Enter');
  await drag(page, x, y, unit, 0);
  await expect(page.locator('.prompt')).toContainText('Rotate');
  await chooseTool(page, 1);
  await turnLattice(page, 90, unit);
  await expect(page.locator('.prompt')).toContainText('Reflect');
  await chooseTool(page, 2);
  await drag(page, x, y, unit, 0);
  await expect(page.locator('.prompt')).toContainText('Glide');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.prompt')).toContainText('line up A, B, and C');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await chooseTool(page, 0);
  await drag(page, x, y, unit, 0);
  await expect(next).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  expect(await stage?.evaluate(node => node.isConnected)).toBe(true);
  await next.press('Enter');
  await expect(page.locator('.scene')).toHaveAttribute('data-scene', 'triangular');
  expect(await stage?.evaluate(node => node.isConnected)).toBe(false);
  await chooseTool(page, 1);
  await turnLattice(page, 60);
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('orbits, selects all feature types, transforms solids, and reuses the renderer', async ({ page }) => {
  await unlockLattices(page);
  await page.goto('/2');
  await page.getByRole('button', { name: 'Orbit the cube' }).click();
  await expect(page.getByRole('toolbar')).toHaveAccessibleName(/Rotate, Reflect/);
  await expect(page.getByRole('combobox', { name: 'Solid', exact: true })).toBeVisible();
  const renderer = await page.locator('.three-canvas > :is(canvas, svg)').elementHandle();
  const { x, y } = await sceneCenter(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 55, y + 20, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Select face' }).click();
  await page.getByRole('button', { name: 'Select edge' }).click();
  await page.getByRole('button', { name: 'Select vertex' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await chooseTool(page, 0);
  await page.getByRole('button', { name: 'Select face' }).click();
  const dial = page.getByLabel('Rotation dial.', { exact: false });
  await dial.press('ArrowRight');
  await dial.press('Enter');
  await expect(page.locator('.prompt')).toContainText('colored mirror plane');
  await chooseTool(page, 1);
  await page.getByRole('button', { name: 'Select face' }).click();
  await page.getByRole('button', { name: 'Reflect across plane 1', exact: true }).click();
  for (const solid of ['Tetrahedron', 'Octahedron', 'Dodecahedron', 'Icosahedron']) {
    await page.getByRole('combobox', { name: 'Solid', exact: true }).selectOption(solid);
    await expect(page.getByRole('combobox', { name: 'Solid', exact: true })).toHaveValue(solid);
  }
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.getByRole('button', { name: 'Square lattice' }).click();
  await expect(page.locator('.three-canvas')).toHaveCount(0);
  expect(await renderer?.evaluate(node => node.isConnected)).toBe(false);
  await page.getByRole('button', { name: 'Orbit the cube' }).click();
  await expect(page.locator('.three-canvas')).toHaveCount(1);
  expect(await renderer?.evaluate(node => node.isConnected)).toBe(true);
});

test('keeps navigation and scene usable on a narrow screen during repeated jumps', async ({ page }) => {
  await unlockLattices(page);
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto('/2');
  await page.getByRole('button', { name: 'Replay', exact: true }).click();
  const audio = await page.locator('audio').elementHandle();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Orbit the cube' }).click();
    await expect(page.locator('.three-canvas')).toHaveCount(1);
    await page.getByRole('button', { name: 'Square lattice' }).click();
    await expect(page.locator('.scene .konvajs-content')).toHaveCount(1);
  }
  expect(await audio?.evaluate(node => (node as HTMLAudioElement).paused)).toBe(true);
  const { box } = await sceneCenter(page);
  expect(box.width).toBe(390);
  expect(box.height).toBeGreaterThan(300);
});

test('cancels an in-flight lattice transformation on a scene jump', async ({ page }) => {
  await page.goto('/2');
  await page.getByRole('button', { name: 'Continue' }).click();
  await chooseTool(page, 0);
  const { x, y, box } = await sceneCenter(page);
  const unit = Math.max(29, Math.min(47, Math.min(box.width / 14.6, box.height / 9.1)));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + unit, y, { steps: 3 });
  await page.mouse.up();
  // Navigate directly in the same turn, before the animation can complete.
  await page.getByRole('button', { name: 'Office' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await page.getByRole('button', { name: /Tutorial/ }).click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  const completed = await page.evaluate(() => {
    const storage = localStorage.getItem('markdown-based:chapter-zero:v1');
    return JSON.parse(storage ?? '{}').completed;
  });
  expect(completed).toEqual([]);
});
