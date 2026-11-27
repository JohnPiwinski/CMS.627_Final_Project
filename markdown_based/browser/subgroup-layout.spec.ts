import { expect, test } from '@playwright/test';

const scenes = [
  ['A subgroup on the clock', 'clock-order', 'after 3 hops'],
  ['Clock subgroup diagram', 'clock-diagram', 'Modulo 12'],
  ['Subgroups', 'square-diagram', 'Find r × r'],
  ['Cosets', 'coset-explorer', '2 cosets'],
  ['Normal subgroups', 'coset-overlays', 'Right:'],
  ['Quotient groups', 'quotient-expanded', 'D₄ / H ≅ C₂'],
] as const;

for (const viewport of [{ width: 390, height: 760 }, { width: 1920, height: 900 }]) {
  test(`renders the subgroup lesson at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const button = (name: string) => page.getByRole('button', { name, exact: true });
    await button('Play').click();
    await page.getByRole('button', { name: /Enter Emmy Noether/ }).click();
    await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
    const canvas = page.locator('.chapter-canvas');
    const status = page.getByRole('status');
    for (const [title, snapshot, ready] of scenes) {
      await button(title).click();
      await expect(status).toContainText(ready);
      if (title === 'Normal subgroups') {
        await button('Identity and a reflection').focus();
        await page.keyboard.press('Enter');
        await expect(status).toContainText('r, sr');
      }
      await expect(canvas).toHaveScreenshot(`${snapshot}-${viewport.width}.png`, {
        scale: 'css',
        maxDiffPixelRatio: 0.002,
      });
      if (title === 'Subgroups') {
        const bounds = (await canvas.boundingBox())!;
        const scale = Math.min(bounds.width / 800, bounds.height / 520);
        // Click the visible r² square in the Rotations card.
        await canvas.click({ position: {
          x: (bounds.width - 800 * scale) / 2 + 347 * scale,
          y: (bounds.height - 520 * scale) / 2 + 193 * scale,
        } });
        await expect(status).toContainText('Result: r²');
      }
    }

    await button('Collapse cosets').focus();
    await page.keyboard.press('Enter');
    await expect(button('Expand cosets')).toHaveCount(1);
    await expect(canvas).toHaveScreenshot(`quotient-collapsed-${viewport.width}.png`, {
      scale: 'css',
      maxDiffPixelRatio: 0.002,
    });
  });
}
