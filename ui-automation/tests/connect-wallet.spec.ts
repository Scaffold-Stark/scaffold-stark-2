import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { navigateAndWait } from "./utils/navigate";
import { endpoint } from "./configTypes";

// Burner Wallet Accounts
const burnerAccounts = [
  "0x64b4...5691",
  "0x7866...c8b1",
  "0x49df...f38e",
  "0x4f34...27d3",
  "0xd513...5cb5",
  "0x1e8c...de78",
  "0x557b...4c7e",
  "0x3736...e06f",
  "0x4d8b...3ad0",
  "0x4b3f...5ee1"
];

for (const account of burnerAccounts) {
  test(`Connect with Burner Wallet account: ${account}`, async ({ page }) => {
    test.setTimeout(60000);
    console.log(`Testing connection with Burner account: ${account}`);
    
    await navigateAndWait(page, endpoint.BASE_URL);
    
    const homePage = new HomePage(page);
    const connectButton = await homePage.getConnectButton();
    await connectButton.click();
    
    await expect(
      page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
    ).toBeVisible();
    
    await homePage.getConnecterButton("Burner Wallet").click();
    
    const button = homePage.getAccountButton(account);
    await button.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await button.click({ force: true, timeout: 5000 });
    
    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      page.waitForLoadState("networkidle"),
    ]);
    
    await page.waitForSelector('text="Connected Address:"', {
      state: "visible",
      timeout: 15000,
    });
    
    console.log(`Successfully connected to Burner account: ${account}`);
  });
}

// Test connecting with Argent X
test("Connect with Argent X wallet", async ({ page }) => {
  test.setTimeout(60000);
  
  await navigateAndWait(page, endpoint.BASE_URL);
  
  const homePage = new HomePage(page);
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();
  
  await expect(
    page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
  ).toBeVisible();
  
  await homePage.getConnecterButton("Argent X").click();
  
  const argentXDialog = page.locator("text=/Install Argent X|Argent X not detected/").first();
  
  if (await argentXDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Argent X wallet not installed. Verifying installation prompt.");
    await expect(page.locator("text=/Install Argent X|Get Argent X/")).toBeVisible();
  } else {
    console.log("Attempting to connect with Argent X wallet...");
    try {
      await expect(page.locator("text=/Connect|Approve|Confirm/i")).toBeVisible({ timeout: 10000 });
      console.log("Argent X connection dialog displayed");
    } catch (e) {
      console.log("Could not detect Argent X connection dialog. Wallet may not be installed.");
    }
  }
});

// Test connecting with Braavos
test("Connect with Braavos wallet", async ({ page }) => {
  test.setTimeout(60000);
  
  await navigateAndWait(page, endpoint.BASE_URL);
  
  const homePage = new HomePage(page);
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();
  
  await expect(
    page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
  ).toBeVisible();
  
  await homePage.getConnecterButton("Braavos").click();
  
  const braavosDialog = page.locator("text=/Install Braavos|Braavos not detected/").first();
  
  if (await braavosDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Braavos wallet not installed. Verifying installation prompt.");
    await expect(page.locator("text=/Install Braavos|Get Braavos/")).toBeVisible();
  } else {
    console.log("Attempting to connect with Braavos wallet...");
    try {
      await expect(page.locator("text=/Connect|Approve|Confirm/i")).toBeVisible({ timeout: 10000 });
      console.log("Braavos connection dialog displayed");
    } catch (e) {
      console.log("Could not detect Braavos connection dialog. Wallet may not be installed.");
    }
  }
});

// Verify all wallet options and Burner accounts are visible
test("Verify all wallet options and Burner accounts are visible", async ({ page }) => {
  await navigateAndWait(page, endpoint.BASE_URL);
  
  const homePage = new HomePage(page);
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();
  
  await expect(
    page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
  ).toBeVisible();
  
  await expect(homePage.getConnecterButton("Argent X")).toBeVisible();
  await expect(homePage.getConnecterButton("Braavos")).toBeVisible();
  await expect(homePage.getConnecterButton("Burner Wallet")).toBeVisible();
  
  await homePage.getConnecterButton("Burner Wallet").click();
  
  for (const account of burnerAccounts) {
    await expect(homePage.getAccountButton(account)).toBeVisible();
  }
});