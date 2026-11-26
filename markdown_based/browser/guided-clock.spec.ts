import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 740 }, { width: 1180, height: 760 }]) {
  test(`walks Chapter 1 at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
    await expect(page.locator('.chapter-one .dot')).toHaveCount(21);
    await expect(page.locator('.group-definition-slide .katex').first()).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Addition on a clock' })).toBeVisible();
    const clip = page.locator('audio');
    await expect(clip).toHaveAttribute('src', /clock-addition-intro/);
    await expect(page.getByRole('button', { name: 'Pause voiceover' })).toBeVisible();
    const prior = await clip.elementHandle();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    expect(await prior?.evaluate(node => (node as HTMLAudioElement).paused)).toBe(true);
    await expect(clip).toHaveAttribute('src', /clock-addition-operation/);

    const canvas = page.locator('.chapter-canvas canvas');
    await expect(page.getByRole('status')).toContainText('5+8');
    const host = page.locator('.chapter-canvas');
    await expect.poll(async () => Math.round((await canvas.boundingBox())?.width ?? 0)).toBe(viewport.width);
    const rect = (await host.boundingBox())!;
    const scale = Math.min(rect.width / 800, rect.height / 520);
    const point = (x: number, y: number) => ({
      x: rect.x + (rect.width - 800 * scale) / 2 + x * scale,
      y: rect.y + (rect.height - 520 * scale) / 2 + y * scale,
    });
    const origin = point(176, 273);
    const destination = point(207, 220);
    await page.mouse.move(origin.x, origin.y);
    await page.mouse.down();
    await page.mouse.move(destination.x, destination.y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('status')).toContainText('3+8');
    await page.getByRole('button', { name: 'Hand 2 +', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('3+9');

    const dots = page.locator('.chapter-one .dot');
    for (let i = 2; i < 21; i++) {
      await dots.nth(i).click();
      await expect(dots.nth(i)).toHaveAttribute('aria-current', 'step');
      await expect(canvas).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Quotient groups', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Bonus lessons' })).toBeVisible();
    await page.getByRole('button', { name: 'Finish chapter' }).click();
    await expect(page.getByRole('button', { name: /Introductory Group Theory/ })).toBeVisible();
  });
}

test('shows the colored associativity statement and keeps arc controls working at both viewport sizes', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 740 }, { width: 1180, height: 760 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
    await page.getByRole('button', { name: 'Associativity', exact: true }).click();

    const canvas = page.locator('.chapter-canvas canvas');
    const status = page.getByRole('status');
    await expect(canvas).toBeVisible();
    await expect(status).toContainText('Associativity: (a + b) + c equals a + (b + c).');
    await expect(status).toContainText('(2 + 3) + 2 is congruent to 7 modulo 12.');

    await page.getByRole('button', { name: 'Red +', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(status).toContainText('(3 + 3) + 2 is congruent to 8 modulo 12.');
  }
});
