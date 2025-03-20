import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { StrkDebugPage } from "./pages/StrkDebugPage";
import { endpoint } from "./configTypes";

const BURNER_WALLET_ACCOUNT = "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
const BURNER_WALLET_SHORT = "0x64b4...5691";

test("Check Balance of Connected Burner Wallet on Strk Tab", async ({ page }) => {
  test.setTimeout(30000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();

  await homePage.getConnecterButton("Burner Wallet").click();

  const accountButton = homePage.getAccountButton(BURNER_WALLET_SHORT);
  await accountButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await accountButton.click({ force: true, timeout: 5000 });

  await page.waitForTimeout(3000);

  await homePage.getDebugPageLinkButton().click();
  await page.waitForTimeout(2000);

  const debugPage = new StrkDebugPage(page);

  await debugPage.switchToStrkTab();

  await debugPage.fillBalanceOfInput(BURNER_WALLET_ACCOUNT);

  await debugPage.clickBalanceOfReadButton();

  await page.waitForTimeout(2000);

  const resultText = await debugPage.getBalanceOfResultText();
  console.log(`Balance of ${BURNER_WALLET_ACCOUNT}: ${resultText}`);

  expect(resultText).toContain("Ξ");
});

test("Transfer STRK from Write tab", async ({ page }) => {
  test.setTimeout(30000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();
  await homePage.getConnecterButton("Burner Wallet").click();

  const accountButton = homePage.getAccountButton(BURNER_WALLET_SHORT);
  await accountButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await accountButton.click({ force: true, timeout: 5000 });
  await page.waitForTimeout(3000);

  await homePage.getDebugPageLinkButton().click();
  await page.waitForTimeout(2000);

  const debugPage = new StrkDebugPage(page);
  
  await debugPage.switchToStrkTab();
  
  const recipientAddress = "0x047147e40fbd5c4ad2170d69e3b7a695f29df47ac04485781e62088c099308d";
  const transferAmount = "10";
  
  console.log(`Transferring ${transferAmount} STRK to contract address: ${recipientAddress}`);
  
  await debugPage.performTransfer(recipientAddress, transferAmount);
  
  console.log(`Transfer completed: ${transferAmount} STRK sent to ${recipientAddress}`);
  
  await page.waitForTimeout(3000);
});