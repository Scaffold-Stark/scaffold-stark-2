import { test } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { ArgentXWalletPage } from "./pages/ArgentXWalletPage";
import { navigateAndWait } from "./utils/navigate";
import { endpoint } from "./configTypes";
import { chromium } from "@playwright/test";
import { StrkDebugPage } from "./pages/StrkDebugPage";

import path = require("path");
import fs = require("fs");

const ARGENT_WALLET_ADDRESS = "0x0525628B7D03332237B7fe1e919b9DeDe66004a1eEc33885D97A512df87077b2"
const TRANSFER_AMOUNT = "1";
const isDocker = process.cwd().includes('/app');

const testTimestamp = Date.now();
const testId = `argentx-wallet-interaction-${testTimestamp}`;

const modifyLocalScaffoldConfig = (fromNetwork: string, toNetwork: string) => {
  if (isDocker) {
    return;
  }

  const scaffoldConfigPath = path.resolve(__dirname, "../../packages/nextjs/scaffold.config.ts");

  if (fs.existsSync(scaffoldConfigPath)) {
    let content = fs.readFileSync(scaffoldConfigPath, 'utf8');
    
    // Replace the network in the targetNetworks array
    content = content.replace(
      new RegExp(`targetNetworks: \\[chains\\.${fromNetwork}\\]`), 
      `targetNetworks: [chains.${toNetwork}]`
    );
    
    fs.writeFileSync(scaffoldConfigPath, content);
    console.log(`[${testId}] Modified scaffold.config.ts to use ${toNetwork} instead of ${fromNetwork}`);
  } else {
    console.warn("scaffold.config.ts not found at expected path");
  }
};

const editScaffoldConfig = () => {
  console.log(`[${testId}] Editing scaffold config from devnet to sepolia...`);
  modifyLocalScaffoldConfig('devnet', 'sepolia');
};

const revertScaffoldConfig = () => {
  console.log(`[${testId}] Reverting scaffold config from sepolia to devnet...`);
  modifyLocalScaffoldConfig('sepolia', 'devnet');
};

const launchContextWithExtension = async (extensionName: "argentx") => {
  console.log(`[${testId}] Launching context with ${extensionName} extension...`);
  const extensionPath = isDocker
    ? `/app/extensions/${extensionName}`
    : path.resolve(__dirname, `../extensions/${extensionName}`);

  const context = await chromium.launchPersistentContext('', {
    headless: isDocker ? true : false,
    args: [
      isDocker ? `--headless=chrome` : '',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();
  console.log(`[${testId}] Extension context and page launched.`);
  return { context, page };
};

const expect = test.expect;

/**
 * Tests connecting to the dApp with Argent X wallet
 * Verifies the wallet extension is detected and connection dialog appears
 */
test("Test interact with STRK contract using Argent X wallet", async () => {
  test.setTimeout(120000);

  editScaffoldConfig();

  const { page } = await launchContextWithExtension("argentx");

  try {
    await page.waitForTimeout(5000);

    const context = page.context();
    const homePage = new HomePage(page);
    const debugPage = new StrkDebugPage(page);

    await test.step("Restore and connect Argent X wallet", async () => {
      console.log(`[${testId}] Attempting to find Argent X extension page...`);
      const extension = context.pages().find(p => p.url().startsWith("chrome-extension://"));

      if (!extension) {
        throw new Error("Argent X extension not found");
      }

      const argentXWalletPage = new ArgentXWalletPage(extension);
      console.log(`[${testId}] Restoring wallet...`);
      await argentXWalletPage.restoreWallet("MyS3curePass!");

      console.log(`[${testId}] Switching network to Sepolia...`);
      await argentXWalletPage.switchNetwork("Sepolia");

      console.log(`[${testId}] Navigating to dApp at ${endpoint.BASE_URL}...`);
      await navigateAndWait(page, endpoint.BASE_URL);

      console.log(`[${testId}] Clicking connect button...`);
      await homePage.safeClick(homePage.getConnectButton(), "Connect button");

      console.log(`[${testId}] Clicking Argent X connector...`);
      await homePage.safeClick(
        homePage.getConnecterButton("Argent X"),
        "Argent X button"
      );

      console.log(`[${testId}] Clicking connect in wallet extension...`);
      await argentXWalletPage.clickConnect();

      console.log(`[${testId}] Navigating to debug page...`);
      await homePage.safeClick(
        homePage.getDebugPageLinkButton(),
        "Debug page link button"
      );

      await page.waitForTimeout(2000);

      return argentXWalletPage;
    });

    await test.step("Read initial balance", async () => {
      console.log(`[${testId}] Filling balance input with address: ${ARGENT_WALLET_ADDRESS}`);
      await debugPage.fillBalanceOfInput(ARGENT_WALLET_ADDRESS);

      console.log(`[${testId}] Clicking balanceOf read button...`);
      await debugPage.clickBalanceOfReadButton();

      const initialBalanceText = await debugPage.getBalanceOfResultText();
      console.log(`[${testId}] Initial balance: ${initialBalanceText}`);
      expect(initialBalanceText).toContain("Ξ");
    });

    await test.step("Send STRK tokens", async () => {
      const argentXWalletPage = new ArgentXWalletPage(context.pages().find(p => p.url().startsWith("chrome-extension://"))!);

      console.log(`[${testId}] Transferring ${TRANSFER_AMOUNT} STRK tokens...`);
      const transferResult = await debugPage.performTransfer(
        ARGENT_WALLET_ADDRESS,
        TRANSFER_AMOUNT,
        argentXWalletPage,
        true,
      );

      console.log(`[${testId}]  Transfer result: ${JSON.stringify(transferResult)}`);
      expect(transferResult.success).toBe(true);
    });
  } catch (error) {
    test.fail(
      true,
      `Failed to connect with Argent X wallet: ${error instanceof Error ? error.message : String(error)}`
    );
    console.error(`[${testId}] Error occurred:`, error);
  } finally {
    revertScaffoldConfig();
    await page.waitForTimeout(2000);
    console.log(`[${testId}] Test finished. Config reverted and browser paused briefly.`);
  }
});
