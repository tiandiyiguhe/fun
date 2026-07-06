const { test, expect } = require("@playwright/test");

test("simon plays a sequence, accepts input, and handles a miss", async ({ page }) => {
  await page.goto("file:///home/agent/fun/simon.html");
  await page.evaluate(() => localStorage.clear());

  await expect(page.getByRole("heading", { name: "Simon" })).toBeVisible();
  await expect(page.locator("[data-pad]")).toHaveCount(4);

  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator("#level")).toHaveText("1");

  await page.waitForFunction(() => window.Simon.getState().accepting === true);
  const firstColor = await page.evaluate(() => window.Simon.getState().sequence[0]);

  await page.locator(`[data-pad="${firstColor}"]`).click();
  await page.waitForFunction(() => window.Simon.getState().sequence.length === 2);
  await page.waitForFunction(() => window.Simon.getState().accepting === true);
  await expect(page.locator("#level")).toHaveText("2");

  const nextSequence = await page.evaluate(() => window.Simon.getState().sequence);
  const wrongColor = ["green", "red", "yellow", "blue"].find((color) => color !== nextSequence[0]);

  await page.locator(`[data-pad="${wrongColor}"]`).click();
  await page.waitForFunction(() => window.Simon.getState().gameOver === true);
  await expect(page.locator("#status")).toHaveText("Miss");
});
