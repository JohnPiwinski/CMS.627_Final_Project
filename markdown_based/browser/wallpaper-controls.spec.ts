import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button',{name:/Wallpaper Groups/}).click();
  await expect(page.locator('.wallpaper-konva canvas')).toBeVisible();
}
async function drag(page: Page, x: number,y: number,dx: number,dy: number) {
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+dx,y+dy,{steps:8});
  await page.mouse.up();
}
async function selectTool(page: Page, steps: number) {
  const dock = page.getByRole('toolbar');
  for (let i=0;i<steps;i++) await dock.press('ArrowRight');
  await dock.press('Enter');
}
test('snaps translation drags to lattice nodes and keeps the grid visible', async ({page}) => {
  await open(page);
  const surface = page.locator('.wallpaper-konva');
  const box = (await surface.boundingBox())!;
  const x = box.x+box.width/2, y = box.y+box.height/2;
  const period = Math.max(65,Math.min(box.width,box.height)/3.2);
  await drag(page,x+30,y+30,period,0);
  await expect(page.getByRole('status')).toContainText('Start on a translation lattice node');
  await drag(page,x,y,period*.67,0);
  await expect(page.getByRole('status')).toContainText('belongs to the selected group');
  await page.getByRole('button',{name:'Zoom in'}).click();
  await expect(page.getByRole('button',{name:'Lattice',exact:true})).toHaveCount(0);
  await surface.press('Enter');
  await surface.press('ArrowRight');
  await surface.press('Enter');
  await expect(page.getByRole('status')).toContainText('belongs to the selected group');
});

test('opens the Chapter Zero dial at a valid p4 center and commits by keyboard', async ({page}) => {
  await open(page);
  await page.getByRole('button',{name:'Explore the abstract patterns'}).click();
  await page.getByRole('button',{name:'p4',exact:true}).click();
  await selectTool(page,1);
  const surface = page.locator('.wallpaper-konva');
  const box = (await surface.boundingBox())!;
  await page.mouse.click(box.x+box.width/2+29,box.y+box.height/2+31);
  await expect(page.getByRole('status')).toContainText('Choose a highlighted rotation center');
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await expect(page.getByRole('status')).toContainText('Drag around the dial');
  await surface.press('ArrowLeft');
  await surface.press('Enter');
  await expect(page.getByRole('status')).toContainText('belongs to the selected group');
});

test('allows free photo trials before submitting matches', async ({page}) => {
  await open(page);
  await page.getByRole('button',{name:'Match the decorative wallpapers'}).click();
  await page.getByRole('button',{name:'Inspect crop 1',exact:true}).click();
  await page.getByRole('button',{name:'Align guide grid'}).click();
  const box = (await page.locator('.wallpaper-konva').boundingBox())!;
  const x = box.x+box.width/2, y = box.y+box.height/2;
  for (const [dx,dy] of [[0,0],[60,0],[0,60]]) await page.mouse.click(x+dx,y+dy);
  await expect(page.getByRole('status')).toContainText('Lattice set');
  await drag(page,x+12,y+12,43,0);
  await expect(page.getByRole('status')).toContainText('Compare the overlapping parts');
  await page.getByRole('button',{name:'Back to matches'}).click();
  await expect(page.getByRole('status')).toContainText('0 of 17 placed');
  await page.getByRole('button',{name:'Check matches'}).click();
  await expect(page.getByRole('status')).toContainText('0 of 17 correct');
});

test('rejects mirrors and commits a two-step glide on pg', async ({page}) => {
  await open(page);
  await page.getByRole('button',{name:'Glide reflections',exact:true}).click();
  const surface = page.locator('.wallpaper-konva');
  const box = (await surface.boundingBox())!;
  const x = box.x+box.width/2, y = box.y+box.height/2;
  const period = Math.max(65,Math.min(box.width,box.height)/3.2);
  await selectTool(page,2);
  await drag(page,x,y,period*.35,0);
  await expect(page.getByRole('status')).toContainText('Start on a highlighted line');
  await selectTool(page,1);
  await drag(page,x,y,period*.35,0);
  await expect(page.getByRole('status')).toContainText('Now drag along the line');
  await drag(page,x,y,period*.5,0);
  await expect(page.getByRole('status')).toContainText('belongs to the selected group');
});

test.describe('touch gestures', () => {
  test.use({hasTouch:true,viewport:{width:390,height:740}});
  test('opens the shared rotation dial with a tap', async ({page}) => {
    await open(page);
    await page.getByRole('button',{name:'Explore the abstract patterns'}).tap();
    await page.getByRole('button',{name:'p4',exact:true}).tap();
    await page.getByRole('toolbar').locator('canvas').tap({position:{x:85,y:62}});
    const box = (await page.locator('.wallpaper-konva').boundingBox())!;
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    await expect(page.getByRole('status')).toContainText('Drag around the dial');
  });
});
