import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
  await page.getByRole('button', { name: 'Quotient groups', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Explore more', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What is a group?' })).toBeVisible();
}

async function point(page: Page, x: number, y: number) {
  const box = await page.locator('.group-canvas').boundingBox();
  if (!box) throw new Error('Missing group canvas');
  return { x: box.x + x * box.width / 800, y: box.y + y * box.height / 520 };
}

async function drag(page: Page, ...path: [number, number][]) {
  const start = await point(page, ...path[0]);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const step of path.slice(1)) {
    const next = await point(page, ...step);
    await page.mouse.move(next.x, next.y, { steps: 8 });
  }
  await page.mouse.up();
}

async function click(page: Page, x: number, y: number) {
  const where = await point(page, x, y);
  await page.mouse.click(where.x, where.y);
}

test('sweeps the modular clock across zero, cancels a gesture, and compares multiplication', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Open the clock' }).click();
  const result = page.locator('.group-caption strong');
  await drag(page, [358, 160], [400, 151], [442, 160]);
  await expect(result).toHaveText('2-tick shift · position 1');
  const start = await point(page, 442, 160);
  const finish = await point(page, 485, 235);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(finish.x, finish.y, { steps: 8 });
  await expect(result).toContainText('position 3');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(result).toContainText('position 1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(result).toContainText('position 11');

  await page.getByLabel('Clock size').selectOption('8');
  await page.getByRole('button', { name: 'Multiply', exact: true }).click();
  await drag(page, [384, 471], [400, 235]);
  await expect(result).toHaveText('1 × 3 ≡ 3 (mod 8)');
  await page.getByRole('button', { name: 'Pin paths' }).click();
  await drag(page, [352, 471], [564, 235]);
  await expect(result).toHaveText('2 × 2 ≡ 4 (mod 8)');
  await expect(page.getByText(/2 has no multiplicative inverse/)).toBeVisible();
  await page.getByRole('button', { name: 'Distribute' }).click();
  await expect(page.getByText(/Scaling separately gives/)).toBeVisible();
  await page.getByLabel('Clock size').selectOption('7');
  await page.getByRole('button', { name: 'Distribute' }).click();
  await expect(page.getByText(/This ring is a field/)).toBeVisible();
});

test('scrubs factorial remainders and pairs inverse factors by dragging', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Open the clock' }).click();
  await page.getByLabel('Clock size').selectOption('7');
  await page.getByRole('button', { name: 'Factorials', exact: true }).click();
  await drag(page, [205, 420], [595, 420]);
  await expect(page.locator('.group-caption strong')).toHaveText('6! ≡ 6 (mod 7)');
  await drag(page, [353.5, 469], [415.5, 469]);
  await expect(page.getByText('2 and 4 multiply to 1.')).toBeVisible();
  await drag(page, [384.5, 469], [446.5, 469]);
  await expect(page.getByText('3 and 5 multiply to 1.')).toBeVisible();
  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.getByText(/Unpaired factors: 1, 6/)).toBeVisible();
  await page.getByRole('button', { name: 'Why?' }).click();
  await expect(page.getByText(/Wilson’s theorem says/)).toBeVisible();
});

test('turns and mirrors the square, then reorders and regroups the actual move history', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Square', exact: true }).click();
  await drag(page, [499, 98], [400, 58], [301, 98]);
  await expect(page.locator('.group-caption strong')).toContainText('Result r');
  await page.getByRole('button', { name: 'Mirror', exact: true }).click();
  await drag(page, [400, 116], [400, 263]);
  await expect(page.locator('.group-caption strong')).toHaveText('r → s · Current move r³s · Result r³s');
  await drag(page, [142, 393], [198, 393]);
  await expect(page.locator('.group-caption strong')).toHaveText('s → r · Current move rs · Result rs');
  await page.getByRole('button', { name: 'Compare orders' }).click();
  await expect(page.getByText(/Four turns and four reflections/)).toBeVisible();

  await page.getByRole('button', { name: 'Group rules' }).click();
  await drag(page, [361, 477], [254, 393]); // r³
  await expect(page.locator('.group-caption strong')).toContainText('Result s');
  await drag(page, [182, 372], [239, 372]);
  await expect(page.getByText(/Last two first gives/)).toBeVisible();
  await expect(page.locator('.group-caption strong')).toContainText('Result s');
  await drag(page, [282, 434], [114, 434]);
  await expect(page.locator('.group-caption strong')).toContainText('Current move e');
});

test('moves subgroup elements and whole boundaries, then scrubs conjugation', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Subgroups' }).click();
  await page.getByLabel('Example').selectOption('candidate');
  await drag(page, [208, 138], [205, 446]);
  await drag(page, [208, 138], [266, 446]);
  await expect(page.getByText(/r then r gives r² outside the boundary/)).toBeVisible();
  await drag(page, [183, 340], [254, 138]);
  await expect(page.locator('.group-caption strong')).toContainText('e, r, s');

  await page.getByRole('button', { name: 'Cosets' }).click();
  await drag(page, [250, 138], [161, 263]);
  await expect(page.locator('.group-caption strong')).toHaveText('1 of 2 coset tiles discovered');
  await drag(page, [250, 138], [467, 263]);
  await expect(page.locator('.group-caption strong')).toHaveText('2 cosets × 4 moves = 8 moves');
  await click(page, 639, 263);
  await expect(page.getByText(/rsH =/)).toBeVisible();
  await expect(page.locator('.group-caption strong')).toHaveText('2 cosets × 4 moves = 8 moves');

  await page.getByRole('button', { name: 'Normality' }).click();
  await drag(page, [581, 98], [540, 83], [499, 98]);
  await page.getByLabel('Follow member').selectOption('1');
  await drag(page, [190, 442], [330, 442], [470, 442], [610, 442]);
  await expect(page.locator('.group-caption strong')).toHaveText('gHg⁻¹ = { e, r²s } · Different set');
  await expect(page.getByText(/This subgroup is not normal/)).toBeVisible();
  await page.getByLabel('Example').selectOption('rotations');
  await page.getByLabel('Scrub conjugation').focus();
  await page.keyboard.press('End');
  await expect(page.locator('.group-caption strong')).toContainText('Same set');
});

test('collapses cosets and composes orientation tokens on a narrow screen with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await page.getByRole('button', { name: /Bonus · Quotient/ }).click();
  await drag(page, [247, 263], [280, 330]);
  await drag(page, [553, 263], [520, 330]);
  await drag(page, [520, 330], [280, 330]);
  await expect(page.locator('.group-caption strong')).toHaveText('Keep then Flip → Flip');
  await page.getByLabel('First representative').selectOption('5');
  await expect(page.getByText(/Flip then Flip gives Keep/)).toBeVisible();
});

test.describe('touch gestures', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 740 } });

  test('moves the clock hand with one finger', async ({ page, context }) => {
    await open(page);
    await page.getByRole('button', { name: 'Open the clock' }).tap();
    const session = await context.newCDPSession(page);
    const points = await Promise.all([point(page, 358, 160), point(page, 400, 151), point(page, 442, 160)]);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [points[0]] });
    for (const touch of points.slice(1)) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.group-caption strong')).toHaveText('2-tick shift · position 1');
  });
});
