import { expect, test, type Page } from '@playwright/test';

async function pointInRoom(page: Page, x: number, y: number) {
  const room = await page.locator('.adventure-room.ready').boundingBox();
  if (!room) throw new Error('Office illustration is missing');
  return { x: room.x + x / 1672 * room.width, y: room.y + y / 941 * room.height };
}

async function clickObject(page: Page, x: number, y: number) {
  const point = await pointInRoom(page, x, y);
  await page.mouse.click(point.x, point.y);
}

test('reveals the room and all levels together after the artwork decodes', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/office/emmy-noether-office.webp', async route => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Opening the office…')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Select a level' })).toHaveCount(0);
  await expect(page.locator('.adventure-room')).toBeHidden();
  release();
  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Select a level' }).getByRole('button')).toHaveCount(4);
});

test('keyboard focus and room hover select the same objects', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.goto('/');
  const clock = page.getByRole('button', { name: /Introductory Group Theory/ });
  await clock.focus();
  await expect(clock).toHaveClass(/active/);
  await expect.poll(() => page.locator('.adventure-canvas canvas').evaluate(node => {
    const canvas = node as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels?.some((_, index) => index % 4 === 0 && pixels[index] === 255 &&
      pixels[index + 1] === 255 && pixels[index + 2] === 255 && pixels[index + 3] > 200) ?? false;
  })).toBe(true);
  const desk = await pointInRoom(page, 700, 690);
  await page.mouse.move(desk.x, desk.y);
  await expect(page.getByRole('button', { name: /Tutorial/ })).toHaveClass(/active/);
  await clock.press('Enter');
  await expect(page.getByRole('heading', { name: 'Introduction to Group Theory' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Definition of a group' })).toBeAttached();
});

test('opens all four activities from their illustrated objects', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await clickObject(page, 720, 710);
  await expect(page.getByRole('heading', { name: 'Square lattice' })).toBeVisible();
  await page.getByRole('button', { name: 'Office' }).click();

  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await clickObject(page, 160, 200);
  await expect(page.getByRole('heading', { name: 'Definition of a group' })).toBeAttached();
  await page.getByRole('button', { name: /Office/ }).press('Enter');

  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await clickObject(page, 1470, 460);
  await expect(page.getByRole('heading', { name: 'The Orbit-Stabilizer Theorem' })).toBeVisible();
  await expect(page.locator('#orbit-view .three-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Office' }).click();

  await expect(page.locator('.adventure-room.ready')).toBeVisible();
  await clickObject(page, 675, 205);
  await expect(page.getByRole('heading', { name: 'Wallpaper Symmetries' })).toBeVisible();
  await expect(page.locator('.wallpaper-konva canvas')).toBeVisible();
});
