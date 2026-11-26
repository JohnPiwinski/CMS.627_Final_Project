import { expect, test } from '@playwright/test';

test('moves cosets with the shared rotation dial and opens large blocks', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:/Orbit Stabilizer/}).click();
  await page.getByRole('button',{name:'Moving cosets',exact:true}).click();
  const board=page.getByRole('complementary',{name:'Coset blocks'});
  const blocks=board.locator('.coset-block');
  await expect(blocks).toHaveCount(4);
  await expect(page.locator('.solid-position-label')).toHaveCount(4);
  const original=await blocks.first().innerText();
  await page.getByRole('button',{name:'Select vertex',exact:true}).click();
  const dial=page.getByLabel('Rotation dial.',{exact:false});
  await dial.press('ArrowRight');
  await dial.press('Enter');
  await expect(blocks.first()).toHaveAccessibleName('Coset at position A, 3 moves');
  await expect.poll(()=>blocks.first().innerText()).not.toBe(original);

  await page.getByRole('button',{name:'Reset experiment',exact:true}).click();
  await expect.poll(()=>blocks.first().innerText()).toBe(original);
  async function halfTurn() {
    await page.getByRole('button',{name:'Select edge',exact:true}).click();
    await dial.press('ArrowRight');
    await dial.press('Enter');
  }
  await halfTurn();
  await expect(blocks.first()).not.toHaveAccessibleName('Coset at position A, 3 moves');
  await halfTurn();
  await expect.poll(()=>blocks.first().innerText()).toBe(original);
  await page.getByRole('combobox',{name:'Solid',exact:true}).selectOption('Icosahedron');
  await page.getByRole('button',{name:'Full group',exact:true}).click();
  await page.setViewportSize({width:390,height:740});
  await expect(blocks).toHaveCount(12);
  await blocks.last().focus();
  await expect(page.locator('.solid-position-label')).toHaveText('12');
  await blocks.last().press('Enter');
  const popup=page.getByRole('dialog',{name:'Moves at position 12'});
  await expect(popup.locator('li')).toHaveCount(10);
  await popup.getByRole('button',{name:'Close'}).press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(blocks.last()).toBeFocused();
});


test.describe('touch',()=>{
  test.use({hasTouch:true,viewport:{width:390,height:740}});
  test('opens a coset list by tapping a block',async({page})=>{
    await page.goto('/');
    await page.getByRole('button',{name:/Orbit Stabilizer/}).tap();
    await page.getByRole('button',{name:'Moving cosets',exact:true}).tap();
    await page.getByRole('button',{name:'Coset at position B, 3 moves'}).tap();
    const popup=page.getByRole('dialog',{name:'Moves at position B'});
    await expect(popup.locator('li')).toHaveCount(3);
    await popup.getByRole('button',{name:'Close'}).tap();
    await expect(popup).toHaveCount(0);
  });
});
