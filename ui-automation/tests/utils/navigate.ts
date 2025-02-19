import { Page } from "@playwright/test";

export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    page.waitForLoadState("networkidle"),
  ]);
}
