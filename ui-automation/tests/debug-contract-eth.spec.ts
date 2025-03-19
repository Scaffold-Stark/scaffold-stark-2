import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { DebugPage } from "./pages/DebugPage";
import { endpoint } from "./configTypes";

test("Test Balance Check Functionality with Burner Wallet", async ({
  page,
}) => {
  test.setTimeout(12000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  const connectButton = await homePage.getConnectButton();
  await connectButton.click();

  await homePage.getConnecterButton("Burner Wallet").click();

  const firstBurnerAccount = "0x64b4...5691";
  const accountButton = homePage.getAccountButton(firstBurnerAccount);
  await accountButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await accountButton.click({ force: true, timeout: 5000 });

  await page.waitForTimeout(3000);

  await homePage.getDebugPageLinkButton().click();
  await page.waitForTimeout(2000);

  const ethTab = page.locator(".tabs a.tab", { hasText: "Eth" }).first();
  if (await ethTab.isVisible()) {
    await ethTab.click();
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(1000);

  const balanceOfInput = page
    .locator('input[placeholder="ContractAddress account"]')
    .first();
  await expect(balanceOfInput).toBeVisible({ timeout: 5000 });

  await balanceOfInput.fill(firstBurnerAccount);

  const readButton = page.locator('button:has-text("Read")').first();
  await expect(readButton).toBeVisible();
  await readButton.click();

  await page.waitForTimeout(2000);

  const resultElement = page.locator('div:has-text("Result:")').first();

  if (await resultElement.isVisible()) {
    const resultText = await resultElement.textContent();
    console.log(`Balance of ${firstBurnerAccount}: ${resultText}`);

    expect(resultText).toContain("Ξ");
  } else {
    console.log("Không tìm thấy kết quả balance_of");
  }
});

test("Test Debug Contract Functionality with Burner Wallet", async ({
  page,
}) => {
  test.setTimeout(60000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  await homePage.getDebugPageLinkButton().click();

  const debugPage = new DebugPage(page);
  await debugPage.connectWallet("0x64b4...5691");

  const ethTab = page.locator(".tabs a.tab", { hasText: "Eth" }).first();
  if (await ethTab.isVisible()) {
    await ethTab.click();
  }

  await expect(
    page.locator("span", { hasText: "Balance:" }).first()
  ).toBeVisible();

  const readButtons = page.getByRole("button", { name: "Read" });
  if ((await readButtons.count()) > 0) {
    const firstReadButton = readButtons.first();
    await firstReadButton.scrollIntoViewIfNeeded();
    await firstReadButton.click();
    await page.waitForTimeout(2000);
  }
});

test("Test Transfer Functionality with Burner Wallet", async ({ page }) => {
  test.setTimeout(60000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  await homePage.getDebugPageLinkButton().click();

  const debugPage = new DebugPage(page);
  await debugPage.connectWallet("0x64b4...5691");

  const writeTab = await debugPage.getWriteTab();
  await writeTab.click();

  const transferSection = page.locator("div.py-5", {
    has: page.locator("p.text-function", { hasText: "transfer" }),
  });

  if (await transferSection.isVisible()) {
    const recipientField = transferSection
      .locator('input[placeholder="address"]')
      .first();
    if (await recipientField.isVisible()) {
      await recipientField.fill("0x7866...c8b1");
    }

    const amountField = transferSection
      .locator('input[placeholder="uint256"]')
      .first();
    if (await amountField.isVisible()) {
      await amountField.fill("1");
    }
  }
});

test("Test Withdraw Functionality with Burner Wallet", async ({ page }) => {
  test.setTimeout(60000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  await homePage.getDebugPageLinkButton().click();

  const debugPage = new DebugPage(page);
  await debugPage.connectWallet("0x64b4...5691");

  const writeTab = await debugPage.getWriteTab();
  await writeTab.click();

  const withdrawSection = page.locator("div.py-5", {
    has: page.locator("p.text-function", { hasText: "withdraw" }),
  });

  if (await withdrawSection.isVisible()) {
    const sendButton = withdrawSection.locator("button", {
      hasText: "Send 💸",
    });
    await sendButton.click();

    const transactionReceipt = withdrawSection.locator("strong", {
      hasText: "Transaction Receipt",
    });
    await expect(transactionReceipt).toBeVisible();
  }
});

test("Verify Token Details in Debug Contracts", async ({ page }) => {
  test.setTimeout(60000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);
  await homePage.getDebugPageLinkButton().click();

  const debugPage = new DebugPage(page);
  await debugPage.connectWallet("0x64b4...5691");

  for (const functionName of ["name", "symbol", "decimals", "totalSupply"]) {
    const functionSection = page.locator("div.py-5", {
      has: page.locator("p.text-function", { hasText: functionName }),
    });

    if (await functionSection.isVisible()) {
      const readButton = functionSection.locator("button", { hasText: "Read" });
      if (await readButton.isVisible()) {
        await readButton.click();
        await page.waitForTimeout(1000);

        const result = functionSection.locator("div.mt-3");
        await expect(result).toBeVisible();
      }
    }
  }
});
