import endpoint from "./configTypes";
import { test, expect } from "@playwright/test";

test("Expect to have Home button", async ({ page }) => {
  // Go to the Droplets product page of DigitalOcean web page
  await page.goto(endpoint.BASE_URL);

  // Wait for the page to load
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("link", { name: "Home", exact: true })
  ).toBeVisible();
});
