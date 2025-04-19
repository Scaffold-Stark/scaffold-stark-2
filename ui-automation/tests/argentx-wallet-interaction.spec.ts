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
    console.log(`Modified scaffold.config.ts to use ${toNetwork} instead of ${fromNetwork}`);
  } else {
    console.warn("scaffold.config.ts not found at expected path");
  }
};

const editScaffoldConfig = () => {
  modifyLocalScaffoldConfig('devnet', 'sepolia');
};

const revertScaffoldConfig = () => {
  modifyLocalScaffoldConfig('sepolia', 'devnet');
};

const launchContextWithExtension = async (extensionName: "argentx") => {
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
      const extension = context.pages().find(p => p.url().startsWith("chrome-extension://"));

      if (!extension) {
        throw new Error("Argent X extension not found");
      }

      const argentXWalletPage = new ArgentXWalletPage(extension);
      await argentXWalletPage.restoreWallet("MyS3curePass!");

      await argentXWalletPage.switchNetwork("Sepolia");

      await navigateAndWait(page, endpoint.BASE_URL);

      await homePage.safeClick(homePage.getConnectButton(), "Connect button");
      await homePage.safeClick(
        homePage.getConnecterButton("Argent X"),
        "Argent X button"
      );

      await argentXWalletPage.clickConnect();

      await homePage.safeClick(
        homePage.getDebugPageLinkButton(),
        "Debug page link button"
      );

      await page.waitForTimeout(2000);

      return argentXWalletPage;
    });

    await test.step("Read initial balance", async () => {
      await debugPage.switchToStrkTab();
      await debugPage.fillBalanceOfInput(ARGENT_WALLET_ADDRESS);
      await debugPage.clickBalanceOfReadButton();

      const initialBalanceText = await debugPage.getBalanceOfResultText();
      expect(initialBalanceText).toContain("Ξ");
    });

    await test.step("Send STRK tokens", async () => {
      const argentXWalletPage = new ArgentXWalletPage(context.pages().find(p => p.url().startsWith("chrome-extension://"))!);
      
      const transferResult = await debugPage.performTransfer(
        ARGENT_WALLET_ADDRESS,
        TRANSFER_AMOUNT,
        argentXWalletPage
      );

      expect(transferResult.success).toBe(true);
    });
  } catch (error) {
    test.fail(
      true,
      `Failed to connect with Argent X wallet: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    revertScaffoldConfig();

    await page.waitForTimeout(2000);
  }
});
