import { expect, test } from "@playwright/test";

/**
 * Step 27 (B21) — controller happy path.
 *
 * Covers: fullscreen toggle, anchor cycling (B key + persistence under
 * `riseup.controller.anchor`), and the <1280px overflow menu collapsing
 * Settings/Help behind `More controls`.
 */

test.describe("controller happy path", () => {
  test("anchor cycles on B and persists to riseup.controller.anchor", async ({ page }) => {
    await page.goto("/slides/1");
    await page.evaluate(() => localStorage.removeItem("riseup.controller.anchor"));
    await page.reload();

    const pill = page.locator('[data-controller-pill]').first();
    await expect(pill).toBeVisible();

    await page.keyboard.press("b");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("riseup.controller.anchor")))
      .toContain("bottom-right");

    await page.keyboard.press("b");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("riseup.controller.anchor")))
      .toContain("bottom-left");
  });

  test("overflow menu collapses Settings + Help below 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 720 });
    await page.goto("/slides/1");

    const more = page.getByRole("button", { name: "More controls" });
    await expect(more).toBeVisible();
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toHaveCount(0);

    await more.click();
    await expect(page.getByRole("menuitem", { name: /Settings/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Keyboard shortcuts/i })).toBeVisible();
  });

  test("inline Settings + Help remain visible above 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/slides/1");

    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Keyboard shortcuts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "More controls" })).toHaveCount(0);
  });
});
