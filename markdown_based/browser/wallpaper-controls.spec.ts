import { expect, test, type Page } from "@playwright/test";
async function open(page: Page) {
  await page.goto("/");
  const play = page.getByRole("button", { name: "Play", exact: true });
  if (await play.isVisible()) await play.click();
  const office = page.getByRole("button", {
    name: "Enter Emmy Noether’s office",
    exact: true,
  });
  if (await office.isVisible()) await office.click();
  await page.getByRole("button", { name: /3 Wallpaper Groups/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "What is a wallpaper group?",
      exact: true,
    }),
  ).toBeVisible();
}
test("offers both collections on a single explorer and preserves the chosen group", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Explore the seventeen groups", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Wallpaper group" })
    .selectOption("pg");
  await expect(page.getByRole("toolbar")).toHaveAttribute(
    "aria-label",
    /Glide/,
  );
  await page.getByRole("button", { name: "Wikipedia", exact: true }).focus();
  await page
    .getByRole("button", { name: "Wikipedia", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("combobox", { name: "Wallpaper group" }),
  ).toHaveValue("pg");
  await page
    .getByRole("combobox", { name: "Wallpaper group" })
    .selectOption("p4");
  await expect(page.getByRole("toolbar")).not.toHaveAttribute(
    "aria-label",
    /Glide/,
  );
});
test("steps from the full tile to a half-domain and the tiled wall", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "What is a fundamental domain?", exact: true })
    .click();
  const next = page.getByRole("button", { name: "Next demonstration step" });
  for (let i = 0; i < 3; i++) {
    await next.focus();
    await next.press("Enter");
  }
  await expect(page.getByRole("status")).toContainText(
    "without overlapping interiors",
  );
});
test("lets the learner solve the one-bite puzzle with the shared rotation dial", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Can we change its shape?", exact: true })
    .click();
  const reveal = page.getByRole("button", { name: "Show answer", exact: true });
  await reveal.focus();
  await reveal.press("Enter");
  const select = page.getByRole("button", { name: "Select bite", exact: true });
  await select.focus();
  await select.press("Enter");
  const surface = page.getByRole("region", {
    name: "Fundamental domain dissection workspace",
  });
  await surface.press("Enter");
  await surface.press("ArrowLeft");
  await surface.press("Enter");
  await expect(page.getByRole("status")).toContainText("does not place");
  await surface.press("Enter");
  await surface.press("ArrowRight");
  await surface.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "completes the blue domain",
  );
});
test("supports solution playback, reset, and leaving the chapter", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Can we change its shape?", exact: true })
    .click();
  const show = page.getByRole("button", { name: "Show move", exact: true });
  await show.focus();
  await show.press("Enter");
  await expect(page.getByRole("status")).toContainText("120°");
  const reset = page.getByRole("button", { name: "Reset", exact: true });
  await reset.focus();
  await reset.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Why should two fundamental domains",
  );
  await page.getByRole("button", { name: "← Office", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Emmy Noether’s Office" }),
  ).toBeVisible();
});
