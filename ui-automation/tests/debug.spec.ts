import endpoint from "./configTypes";
import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { DebugPage } from "./pages/DebugPage";

test("interact with contract", async ({ page }) => {
  await navigateAndWait(page, endpoint.BASE_URL);
  const homePage = new HomePage(page);
  await homePage.getDebugPageLinkButton().click();

  await expect(page.getByText("YourContract")).toBeVisible();

  const debugPage = new DebugPage(page);
  await debugPage.connectWallet("0x64b4...5691");

  const writeTab = await debugPage.getWriteTab();
  await writeTab.click();

  const withdrawSection = page.locator("div.py-5", {
    has: page.locator("p.text-function", { hasText: "withdraw" }),
  });
  const sendButton = withdrawSection.locator("button", { hasText: "Send 💸" });
  await sendButton.click();

  const transactionReceipt = withdrawSection.locator("strong", {
    hasText: "Transaction Receipt",
  });
  await expect(transactionReceipt).toBeVisible();
});
