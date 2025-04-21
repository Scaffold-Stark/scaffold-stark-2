import { Page } from "@playwright/test";

export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url, {
    timeout: 30000,
    waitUntil: "networkidle",
  });
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    page.waitForLoadState("networkidle"),
  ]);
}
