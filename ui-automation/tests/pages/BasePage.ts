import { Page, Locator } from "playwright";
import { captureError } from "../utils/error-handler";

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  getConnectButton() {
    return this.page
      .locator('label[for="connect-modal"]')
      .filter({ hasText: /^Connect$/ });
  }

  getConnecterButton(connector: string) {
    return this.page.locator(`button:has-text("${connector}")`);
  }

  getAccountButton(account: string) {
    return this.page.locator(`button:has-text("${account}")`);
  }

  async safeAction<T>(
    action: () => Promise<T>,
    context: string,
    screenshot = true
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (screenshot) {
        const testError = await captureError(this.page, error, context);
        console.error(`Action failed: ${testError.message}`);
      }
      throw error;
    }
  }

  async safeGetText(locator: Locator, context: string): Promise<string> {
    return this.safeAction(
      async () => (await locator.textContent()) || "",
      `Get text from ${context}`
    );
  }

  async safeFill(
    locator: Locator,
    value: string,
    context: string
  ): Promise<void> {
    return this.safeAction(async () => {
      await locator.scrollIntoViewIfNeeded();
      await locator.fill(value);
    }, `Fill ${context} with "${value}"`);
  }

  async safeClick(
    locator: Locator,
    context: string,
    options?: { force?: boolean; timeout?: number }
  ): Promise<void> {
    return this.safeAction(async () => {
      await locator.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);
      await locator.click(options);
      await this.page.waitForTimeout(500);
    }, `Click ${context}`);
  }

  async connectWallet(account: string): Promise<boolean> {
    try {
      const connectButton = await this.getConnectButton();
      await this.safeClick(connectButton, "Connect button");

      await this.safeClick(
        this.getConnecterButton("Burner Wallet"),
        "Burner Wallet connector"
      );

      const button = this.getAccountButton(account);
      await this.safeAction(async () => {
        await button.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500);
        await button.click({ force: true, timeout: 5000 });
      }, `Select account ${account}`);

      return true;
    } catch (error) {
      const testError = await captureError(
        this.page,
        error,
        `Connect wallet ${account}`
      );
      console.error("Failed to connect wallet:", testError.message);
      return false;
    }
  }

  getDebugPageLinkButton() {
    return this.page.locator("a", {
      hasText: "Debug Contracts",
      has: this.page.locator("svg"),
    });
  }
}
