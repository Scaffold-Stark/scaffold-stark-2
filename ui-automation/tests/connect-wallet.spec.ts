import { test, BrowserContext } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import { ArgentXWalletPage } from "./pages/ArgentXWalletPage";
import { navigateAndWait } from "./utils/navigate";
import { endpoint } from "./configTypes";
import { chromium } from "@playwright/test";
import path = require("path");
import { BraavosWalletPage } from "./pages/BraavosWalletPage";
import { captureError } from "./utils/error-handler";
import fs = require("fs");

const burnerAccounts = ["0x64b4...5691"];

const launchContextWithExtension = async (extensionName: "argentx" | "braavos") => {
  const isDocker = process.cwd().includes('/app');
  
  const extensionPath = isDocker 
    ? `/app/extensions/${extensionName}`
    : path.resolve(__dirname, `../extensions/${extensionName}`);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--headless=chrome`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();

  return { context, page };
};

const expect = test.expect;

/**
 * Tests connecting to the dApp with different Burner Wallet accounts
 * Iterates through predefined accounts and verifies successful connection for each
 */
for (const account of burnerAccounts) {
  test(`Connect with Burner Wallet account: ${account}`, async ({ page }) => {
    test.setTimeout(60000);
    const testTimestamp = Date.now();
    const testId = `connect-burner-${account.substring(2, 6)}-${testTimestamp}`;

    try {
      await navigateAndWait(page, endpoint.BASE_URL);

      const homePage = new HomePage(page);

      try {
        await homePage.safeClick(homePage.getConnectButton(), "Connect button");
        await expect(
          page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
        ).toBeVisible();

        await homePage.safeClick(
          homePage.getConnecterButton("Burner Wallet"),
          "Burner Wallet button"
        );

        const button = homePage.getAccountButton(account);
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        await homePage.safeClick(button, `Account button ${account}`, {
          force: true,
          timeout: 5000,
        });

        await Promise.all([
          page.waitForLoadState("domcontentloaded"),
          page.waitForLoadState("networkidle"),
        ]);

        await page.waitForSelector('text="Connected Address:"', {
          state: "visible",
          timeout: 15000,
        });
      } catch (error) {
        throw error;
      }
    } catch (error) {
      test.fail(
        true,
        `Failed to connect with Burner wallet ${account}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

/**
 * Tests connecting to the dApp with Argent X wallet
 * Verifies the wallet extension is detected and connection dialog appears
 */
test("Connect with Argent X wallet", async () => {
  test.setTimeout(60000);

  const { page } = await launchContextWithExtension("argentx");

  const testTimestamp = Date.now();
  const testId = `connect-argentx-${testTimestamp}`;

  try {  
    // Optional: Wait or continue with more onboarding steps
    await page.waitForTimeout(5000);

    const context = page.context();

    const homePage = new HomePage(page);

    const extension = context.pages().find(p => p.url().startsWith("chrome-extension://"));

    if (!extension) {
      throw new Error("Argent X extension not found");
    }

    const argentXWalletPage = new ArgentXWalletPage(extension);

    await argentXWalletPage.createNewWallet('MyS3curePass!');

    await navigateAndWait(page, endpoint.BASE_URL);

    try {
      await homePage.safeClick(homePage.getConnectButton(), "Connect button");

      await expect(
        page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
      ).toBeVisible();

      await homePage.safeClick(
        homePage.getConnecterButton("Argent X"),
        "Argent X button"
      );

      const argentXDialog = page
        .locator("text=/Install Argent X|Argent X not detected/")
        .first();

      if (await argentXDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        test.fail(
          true,
          "Test failed: Argent X wallet extension is not installed in the browser"
        );
        return;
      } else {
        try {
          const isDialogVisible = await argentXWalletPage.isConnectionDialogVisible();
              
          if (!isDialogVisible) {
            test.fail(
              true,
              "Test failed: Could not detect Argent X connection dialog. Wallet may not be installed."
            );
          }

          await argentXWalletPage.clickConnect();

          console.log("Argent X wallet extension detected successfully");
        } catch (e) {
          test.fail(
            true,
            "Test failed: Could not detect Argent X connection dialog. Wallet may not be installed. " + e
          );
        }
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    test.fail(
      true,
      `Failed to connect with Argent X wallet: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Tests connecting to the dApp with Braavos wallet
 * Verifies the wallet extension is detected and connection dialog appears
 */
test("Connect with Braavos wallet", async () => {
  test.setTimeout(60000);
  const { page } = await launchContextWithExtension("braavos");
  const testTimestamp = Date.now();
  const testId = `connect-braavos-${testTimestamp}`;

  try {  
    await page.waitForTimeout(5000);
    const context = page.context();
    const homePage = new HomePage(page);

    const extension = context.pages().find(p => p.url().startsWith("chrome-extension://"));

    if (!extension) {
      throw new Error("Braavos extension not found");
    }

    const braavosWalletPage = new BraavosWalletPage(extension);
    await braavosWalletPage.createNewWallet('MyS3curePass!');
    await navigateAndWait(page, endpoint.BASE_URL);

    try {
      await homePage.safeClick(homePage.getConnectButton(), "Connect button");
      await expect(
        page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
      ).toBeVisible();

      await homePage.safeClick(
        homePage.getConnecterButton("Braavos"),
        "Braavos button"
      );

      const braavosDialog = page
        .locator("text=/Install Braavos|Braavos not detected/")
        .first();

      if (await braavosDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        test.fail(
          true,
          "Test failed: Braavos wallet extension is not installed in the browser"
        );
        return;
      } else {
        try {
          const approvalPage = context.pages().find(page => page.url().includes('dapp-request'));

          if (!approvalPage){
            test.fail(
              true,
              "Test failed: Could not detect Braavos connection dialog. Wallet may not be installed."
            );
            return;
          }
              
          const braavosApprovalPage = new BraavosWalletPage(approvalPage);

          const isDialogVisible = await braavosApprovalPage.isConnectionDialogVisible();
      
          if (!isDialogVisible) {
            test.fail(
              true,
              "Test failed: Could not detect Braavos connection dialog. Wallet may not be installed."
            );
          }

          await braavosApprovalPage.clickConnect();
        } catch (e) {
          test.fail(
            true,
            "Test failed: Could not detect Braavos connection dialog. Wallet may not be installed. " + e
          );
        }
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    test.fail(
      true,
      `Failed to connect with Braavos wallet: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

/**
 * Verifies all wallet connection options are available
 * Checks that Argent X, Braavos, and Burner Wallet options are visible
 * Also verifies all predefined Burner accounts are displayed after selecting Burner Wallet
 */
test("Verify all wallet options and Burner accounts are visible", async ({
  page,
}) => {
  const testTimestamp = Date.now();
  const testId = `verify-wallets-${testTimestamp}`;

  try {
    await navigateAndWait(page, endpoint.BASE_URL);

    const homePage = new HomePage(page);

    try {
      await homePage.safeClick(homePage.getConnectButton(), "Connect button");

      await expect(
        page.getByRole("heading", { name: "Connect a Wallet", level: 3 })
      ).toBeVisible();

      await expect(homePage.getConnecterButton("Argent X")).toBeVisible();
      await expect(homePage.getConnecterButton("Braavos")).toBeVisible();
      await expect(homePage.getConnecterButton("Burner Wallet")).toBeVisible();

      await homePage.safeClick(
        homePage.getConnecterButton("Burner Wallet"),
        "Burner Wallet button"
      );

      let visibleAccounts = 0;
      for (const account of burnerAccounts) {
        try {
          await expect(homePage.getAccountButton(account)).toBeVisible();
          visibleAccounts++;
        } catch (error) {
          await captureError(
            page,
            error,
            `Check visibility of account ${account}`
          );
          console.error(`Account ${account} is not visible`);
        }
      }

      if (visibleAccounts === burnerAccounts.length) {
      } else {
        test.fail(
          true,
          `Only ${visibleAccounts}/${burnerAccounts.length} burner accounts are visible`
        );
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    test.fail(
      true,
      `Failed to verify wallet options: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});
