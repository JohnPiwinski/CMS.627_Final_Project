import { expect, test } from '@playwright/test';

const elements = ['e', 'r', 'r²', 'r³', 's', 'rs', 'r²s', 'r³s'];
const product = (left: number, right: number) => {
  const mod4 = (value: number) => (value % 4 + 4) % 4;
  const reflected = left >= 4;
  const turn = mod4(left % 4 + (reflected ? -1 : 1) * (right % 4));
  return turn + (reflected !== (right >= 4) ? 4 : 0);
};

for (const viewport of [{ width: 390, height: 740 }, { width: 1180, height: 760 }]) {
  test(`shows all square symmetry previews and composes actions at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
    await page.getByRole('button', { name: 'Symmetries of a square', exact: true }).click();

    const host = page.locator('.chapter-canvas');
    const canvas = host.locator('canvas');
    const status = page.getByRole('status');
    await expect(canvas).toBeVisible();
    await expect(status).toContainText('Current square: e.');
    await expect(page.locator('.chapter-access button')).toHaveCount(8);

    // Click the visible r preview on the Konva scene.
    const rect = (await host.boundingBox())!;
    const designWidth = viewport.width < 650 ? 390 : 800;
    const scale = Math.min(rect.width / designWidth, rect.height / 520);
    const point = (x: number, y: number) => ({
      x: rect.x + (rect.width - designWidth * scale) / 2 + x * scale,
      y: rect.y + (rect.height - 520 * scale) / 2 + y * scale,
    });
    const rotationTile = viewport.width < 650 ? point(146, 271) : point(545, 164);
    await page.mouse.click(rotationTile.x, rotationTile.y);
    await expect(status).toContainText('Current square: r.');

    // Apply s by keyboard and check the transformed state and all eight previews.
    const mirror = page.getByRole('button', { name: 's — apply; preview r³s', exact: true });
    await mirror.focus();
    await page.keyboard.press('Enter');
    let pose = product(4, 1);
    await expect(status).toContainText('Current square: ' + elements[pose] + '.');
    await expect(page.getByRole('button', {
      name: `s — apply; preview ${elements[product(4, pose)]}`, exact: true,
    }))
      .toHaveAttribute('aria-pressed', 'true');

    for (let move = 0; move < elements.length; move++) {
      const preview = elements[product(move, pose)];
      await expect(page.getByRole('button', {
        name: `${elements[move]} — apply; preview ${preview}`, exact: true,
      })).toHaveCount(1);
    }

    // Exercise every element in sequence, including identity, through the accessible controls.
    for (let move = 0; move < elements.length; move++) {
      const preview = product(move, pose);
      const button = page.getByRole('button', {
        name: `${elements[move]} — apply; preview ${elements[preview]}`, exact: true,
      });
      await button.focus();
      await page.keyboard.press('Enter');
      pose = preview;
      await expect(status).toContainText('Current square: ' + elements[pose] + '.');
    }
  });
}
