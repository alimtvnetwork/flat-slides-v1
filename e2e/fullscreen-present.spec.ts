import { expect, test } from "@playwright/test";

test("direct slide fullscreen uses native fullscreen root", async ({ page }) => {
  await page.goto("/slides/1");
  await page.getByRole("button", { name: "Enter fullscreen" }).click();

  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  await expect(page.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
});

test("embedded preview present opens a top-level presenter window", async ({ page, context }) => {
  await page.setContent(`
    <!doctype html>
    <html>
      <body style="margin:0">
        <iframe title="preview" src="/slides/1" style="width:1280px;height:720px;border:0"></iframe>
      </body>
    </html>
  `, { waitUntil: "domcontentloaded" });

  const frame = page.frameLocator('iframe[title="preview"]');
  await expect(frame.getByRole("button", { name: "Enter fullscreen" })).toBeVisible();

  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    frame.getByRole("button", { name: "Enter fullscreen" }).click(),
  ]);

  await popup.waitForLoadState("domcontentloaded");
  await expect(popup).toHaveURL(/\/slides\/1/);
});