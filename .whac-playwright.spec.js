const { test, expect } = require("@playwright/test");
const path = require("path");

test("neon whac-a-mole starts and scores a hit", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("file://" + path.resolve("whac.html"));

  await expect(page.locator(".hole")).toHaveCount(9);
  await expect(page.locator("#score")).toHaveText("0");
  await expect(page.locator("#time")).toHaveText("30");

  await page.locator("#startBtn").click();
  await page.locator(".hole.up").first().waitFor({ timeout: 2500 });
  await page.locator(".hole.up").first().click();

  await expect(page.locator("#score")).toHaveText("1");
  await expect(page.locator(".particle")).not.toHaveCount(0);
  await expect(page.locator("#status")).toHaveText("Live");
  expect(errors).toEqual([]);
});
