import { expect, test } from '@playwright/test';

for (const width of [390, 1180]) {
  test('explores subgroups and quotient groups at width '+width, async ({page}) => {
    await page.setViewportSize({width,height:760});
    await page.goto('/');
    const button = (name:string) => page.getByRole('button',{name,exact:true});
    const keyboard = async (name:string) => {
      await button(name).focus();
      await page.keyboard.press('Enter');
    };
    await button('Play').click();
    await page.getByRole('button',{name:/Enter Emmy Noether/}).click();
    await page.getByRole('button',{name:/Introductory Group Theory/}).click();
    const status=page.getByRole('status');
    await button('A subgroup on the clock').click();
    await expect(status).toContainText('after 3 hops');
    const host = (await page.locator('.chapter-canvas').boundingBox())!;
    const scale = Math.min(host.width / 800, host.height / 520);
    const angle = 5 * Math.PI / 6 - Math.PI / 2;
    await page.mouse.click(
      host.x + host.width / 2 + Math.cos(angle) * 143 * .82 * scale,
      host.y + (host.height - 520 * scale) / 2 + (206 + Math.sin(angle) * 143 * .82) * scale,
    );
    await expect(status).toContainText('after 12 hops');
    await button('Clock subgroup diagram').click();
    const cards=page.getByRole('button',{name:/^Show subgroup /});
    await expect(cards).toHaveCount(6);
    await keyboard('Modulus −');
    await expect(cards).toHaveCount(2);
    await button('Subgroups').click();
    await expect(status).toContainText('Gold marks the given move');
    await expect(button('Inverse')).toHaveCount(0);
    await keyboard('Rotations: r');
    await expect(status).toContainText('r is not the result');
    await keyboard('Rotations: r²');
    await keyboard('Next question');
    await keyboard('Rotations: r³');
    await keyboard('Next question');
    await keyboard('Vertical mirror: e');
    await keyboard('Free exploration');
    await expect(page.getByRole('button',{name:/^Select /})).toHaveCount(10);
    const canvas = page.locator('.chapter-canvas');
    const bounds = (await canvas.boundingBox())!;
    const cardScale = Math.min(bounds.width / 800, bounds.height / 520);
    // Click the Half-turn card's left padding beside the element previews.
    await canvas.click({ position: {
      x: (bounds.width - 800 * cardScale) / 2 + 240 * cardScale,
      y: (bounds.height - 520 * cardScale) / 2 + 293 * cardScale,
    } });
    await expect(button('Select Half-turn')).toHaveAttribute('aria-pressed', 'true');
    await expect(button('Half-turn: e')).toHaveAttribute('aria-pressed', 'false');
    await keyboard('Half-turn: r²');
    await keyboard('Half-turn: r²');
    await expect(status).toContainText('Result: e');
    await keyboard('Inverse');
    await keyboard('Rotations: r');
    await expect(status).toContainText('Result: r³');
    await button('Cosets').click();
    await keyboard('Select Vertical mirror');
    await expect(status).toContainText('4 cosets × 2 moves per coset = 8');
    await button('Normal subgroups').click();
    await expect(status).toHaveText(/Left: (.+)\. Right: \1\.$/);
    await keyboard('Identity and a reflection');
    await expect(status).toContainText('r, rs');
    await expect(status).toContainText('r, sr');
    await button('Quotient groups').click();
    await keyboard('Swap a representative');
    await expect(status).toContainText('same result coset');
    await keyboard('Collapse cosets');
    await keyboard('Compose Reflection');
    await keyboard('Compose Reflection');
    await expect(status).toHaveText('Reflection × Reflection = Rotation');
    await keyboard('Expand cosets');
    await keyboard('Identity and a reflection');
    await keyboard('Swap a representative');
    await expect(status).toContainText('different result coset');
  });
}
