import { Page, Locator } from "playwright";
import { captureError } from "../utils/error-handler";

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Gets the main wallet connect button
   * @returns Locator for the connect button element
   */
  getConnectButton() {
    return this.page
      .locator('label[for="connect-modal"]')
      .filter({ hasText: /^Connect$/ });
  }

  /**
   * Gets a specific wallet connector button by name
   * @param connector The name of the wallet connector (e.g., "Burner Wallet")
   * @returns Locator for the specific connector button
   */
  getConnecterButton(connector: string) {
    return this.page.locator(`button:has-text("${connector}")`);
  }

  /**
   * Gets a specific account selection button by name
   * @param account The account identifier to select
   * @returns Locator for the account button
   */
  getAccountButton(account: string) {
    return this.page.locator(`button:has-text("${account}")`);
  }

  /**
   * Performs an action with error handling and optional screenshot capture
   * @param action The async function to execute safely
   * @param context Description of the action for error reporting
   * @param screenshot Whether to capture a screenshot on error (default: true)
   * @returns Promise of the action result
   */
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

  /**
   * Gets text content from an element with error handling
   * @param locator The element to get text from
   * @param context Description for error reporting
   * @returns Promise with the element's text content
   */
  async safeGetText(locator: Locator, context: string): Promise<string> {
    return this.safeAction(
      async () => (await locator.textContent()) || "",
      `Get text from ${context}`
    );
  }

  /**
   * Fills an input field with a value, with scroll and error handling
   * @param locator The input element to fill
   * @param value The value to enter
   * @param context Description for error reporting
   */
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

  /**
   * Clicks an element with scroll and wait timing, plus error handling
   * @param locator The element to click
   * @param context Description for error reporting
   * @param options Optional Playwright click options
   */
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

  /**
   * Connects to a wallet using the specified account
   * @param account The account to connect with
   * @returns Promise<boolean> indicating success or failure
   */
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

  /**
   * Gets the Debug Contracts link button
   * @returns Locator for the Debug Contracts link
   */
  getDebugPageLinkButton() {
    return this.page.locator("a", {
      hasText: "Debug Contracts",
      has: this.page.locator("svg"),
    });
  }
}
