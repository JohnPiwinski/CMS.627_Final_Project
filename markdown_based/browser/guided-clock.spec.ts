import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 740 }, { width: 1180, height: 760 }]) {
  test(`uses the Konva clock and Markdown narration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
    const canvas = page.locator('.guided-clock-canvas');
    await expect(canvas.locator('canvas')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'What is a group?' })).toBeAttached();
    await page.getByRole('button', { name: 'Around the clock' }).press('Enter');
    const { width, height } = viewport;
    const narrow = width < 640;
    const header = narrow ? 105 : 66;
    const bottom = height - (narrow ? 124 : 104);
    const center = { x: width / 2, y: (header + bottom - 48) / 2 };
    const at = (hour: number) => ({
      x: center.x + Math.cos((hour - 3) * Math.PI / 6) * 72,
      y: center.y + Math.sin((hour - 3) * Math.PI / 6) * 72,
    });
    await expect(page.getByRole('status')).toContainText('Clock position 11');
    await page.mouse.move(at(11).x, at(11).y);
    await page.mouse.down();
    await page.mouse.move(at(0).x, at(0).y, { steps: 8 });
    await expect(page.getByRole('status')).toContainText('Clock position 12');
    await page.mouse.move(at(1).x, at(1).y, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('status')).toContainText('You passed 12 and landed on 1');

    const clip = page.locator('audio');
    await expect(clip).toHaveAttribute('src', /group-clock-around-.*\.mp3/);
    await page.getByRole('button', { name: 'Play voiceover', exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: 'Pause voiceover' })).toBeAttached();
    const first = await clip.elementHandle();
    const span = narrow ? (width - 12) / 3 : Math.min(150, (width - 355) / 3);
    const navX = narrow ? 6 : width - 3 * span - 12;
    await page.mouse.click(navX + span * 1.5, narrow ? 91 : 44);
    await expect(page.getByRole('heading', { name: 'Two names for twelve' })).toBeAttached();
    await expect(clip).toHaveAttribute('src', /group-clock-zero-.*\.mp3/);
    expect(await first?.evaluate(node => (node as HTMLAudioElement).paused)).toBe(true);
    await page.getByRole('button', { name: 'Transcript' }).press('Enter');
    await expect(page.getByText(/they name the same spot/i)).toBeAttached();
    await page.getByRole('button', { name: 'Move forward one tick' }).press('Enter');
    await expect(page.getByRole('status')).toContainText('Starting at 12 or 0 gives the same result: 1');
  });
}

test('plays multiplication and Wilson narration alongside their Konva demos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Introductory Group Theory/ }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', /group-definition-voice-/);
  await expect(page.getByRole('status')).toContainText('(ab)c = a(bc)');
  await expect(page.getByRole('status')).toContainText('ea = ae = a');
  await expect(page.getByRole('status')).toContainText('aa⁻¹ = a⁻¹a = e');
  await page.getByRole('button', { name: 'Multiply on the clock' }).press('Enter');
  await expect(page.locator('.guided-clock-canvas canvas')).toHaveCount(1);
  await expect(page.locator('audio')).toHaveAttribute('src', /group-clock-multiply-/);
  const scene = page.locator('.guided-clock-canvas canvas');
  const bounds = await scene.boundingBox();
  if (!bounds) throw new Error('Guided clock canvas missing');
  const header = bounds.width < 640 ? 105 : 66;
  const bottom = bounds.height - (bounds.width < 640 ? 124 : 104);
  const scale = Math.min(bounds.width / 550, (bottom - header - 105) / 447);
  const offsetX = bounds.width / 2 - 400 * scale;
  const offsetY = (header + 42 + bottom - 60) / 2 - 271 * scale;
  await page.mouse.move(offsetX + 384 * scale, offsetY + 471 * scale);
  await page.mouse.down();
  await page.mouse.move(offsetX + 400 * scale, offsetY + 235 * scale, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('1 × 3 ≡ 3 (mod 8)');
  await page.getByRole('button', { name: 'Multiply by 2' }).press('Enter');
  await expect(page.getByRole('status')).toContainText('1 × 2 ≡ 2 (mod 8)');
  const pinX = bounds.width / 2 + 63;
  await page.mouse.move(pinX, bottom - 31);
  await expect.poll(() => scene.evaluate((node, { x, y }) => {
    const canvas = node as HTMLCanvasElement;
    const [r, g, b] = canvas.getContext('2d')!.getImageData(
      Math.round(x * canvas.width / canvas.clientWidth), Math.round(y * canvas.height / canvas.clientHeight), 1, 1,
    ).data;
    return [r, g, b];
  }, { x: pinX, y: bottom - 75 })).toEqual([32, 48, 47]);
  await page.getByRole('button', { name: 'Wilson’s theorem' }).press('Enter');
  await expect(page.locator('audio')).toHaveAttribute('src', /group-clock-wilson-/);
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Next factorial' }).press('Enter');
  await expect(page.getByRole('status')).toContainText('6! ≡ 6 (mod 7)');
  await page.getByRole('button', { name: 'Pair inverse factors' }).press('Enter');
  await expect(page.getByRole('status')).toContainText('2 and 4 multiply to 1');
  await page.getByRole('button', { name: 'Show proof' }).press('Enter');
  await expect(page.getByText(/Pairing the other factors leaves/)).toBeAttached();
});
