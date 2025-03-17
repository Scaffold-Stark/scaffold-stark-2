import endpoint from "./configTypes";
import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { navigateAndWait } from "./utils/navigate";

test("Expect to connect to devnet with Burner Wallet", async ({ page }) => {
  await navigateAndWait(page, endpoint.BASE_URL);
  await expect(
    page.getByRole("link", { name: "Home", exact: true })
  ).toBeVisible();

  const homePage = new HomePage(page);
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();

  await expect(
    page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
  ).toBeVisible();
  await expect(homePage.getConnecterButton("Braavos")).toBeVisible();
  await expect(homePage.getConnecterButton("Keplr")).toBeVisible();
  await expect(homePage.getConnecterButton("Argent X")).toBeVisible();
  await expect(homePage.getConnecterButton("Burner Wallet")).toBeVisible();

  await homePage.getConnecterButton("Burner Wallet").click();
  await expect(homePage.getAccountButton("0x64b4...5691")).toBeVisible();
  await expect(homePage.getAccountButton("0x7866...c8b1")).toBeVisible();
  await expect(homePage.getAccountButton("0x49df...f38e")).toBeVisible();
  await expect(homePage.getAccountButton("0x4f34...27d3")).toBeVisible();
  await expect(homePage.getAccountButton("0xd513...5cb5")).toBeVisible();
  await expect(homePage.getAccountButton("0x1e8c...de78")).toBeVisible();
  await expect(homePage.getAccountButton("0x557b...4c7e")).toBeVisible();
  await expect(homePage.getAccountButton("0x3736...e06f")).toBeVisible();
  await expect(homePage.getAccountButton("0x4d8b...3ad0")).toBeVisible();
  await expect(homePage.getAccountButton("0x4b3f...5ee1")).toBeVisible();

  const button = homePage.getAccountButton("0x64b4...5691");
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000); // Small delay after scroll
  await button.click({ force: true, timeout: 5000 });

  try {
    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      page.waitForLoadState("networkidle"),
    ]);
    await page.waitForSelector('span:has-text("Starknet Devnet")', {
      state: "visible",
      timeout: 15000,
    });
  } catch (error) {
    console.log("Current URL:", await page.url());
    console.log("Page content:", await page.content());
    throw error;
  }
});
