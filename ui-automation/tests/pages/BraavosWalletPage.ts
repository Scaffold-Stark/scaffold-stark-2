import { Page } from "playwright";
import { BasePage } from "./BasePage";
import { navigateAndWait } from "../utils/navigate";

export class BraavosWalletPage extends BasePage {
  private extensionId: string;

  constructor(page: Page) {
    super(page);
    this.extensionId = page.url().split('/')[2];
  }

  close() {
    return this.page.close();
  }

  /**
   * Creates a new Braavos wallet
   * @param password The password to set for the wallet
   */
  async createNewWallet(password: string) {
    await this.safeClick(
      this.page.getByTestId("create-new-wallet-btn"),
      "Create new wallet button"
    );
    
    await this.setPassword(password);

    await this.safeClick(
      this.page.getByTestId("create-password-loading-btn"),
      "Continue button"
    );

    await this.safeClick(
      this.page.getByTestId("show-seed-phrase-btn"),
      "Show seed phrase button"
    );

    await this.safeClick(
      this.page.getByTestId("checkbox-copied"),
      "Checkbox copied"
    );

    await this.safeClick(
      this.page.getByTestId("new-wallet-seed_done-btn"),
      "Done button"
    );

    await navigateAndWait(this.page, `chrome-extension://${this.extensionId}/index.html`);
  }

  async setPassword(password: string) {
    const passwordInput = this.page.getByTestId("password0");
    const repeatPasswordInput = this.page.getByTestId("password1");
    
    await this.safeFill(passwordInput, password, "Password input");
    await this.safeFill(repeatPasswordInput, password, "Repeat password input");
  }

  /**
   * Checks if the connection dialog is visible in a popup window
   * @returns Promise<boolean> indicating if the connection dialog is visible
   */
  async isConnectionDialogVisible(): Promise<boolean> {
    try {
      // wait 5 seconds
      await this.page.waitForTimeout(5000);

      const connectButton = this.page.getByTestId('dapp-connect-approve-btn');
      return await connectButton.isVisible({ timeout: 10000 });
    } catch (error) {
      return false;
    }
  }

  async clickConnect() {
    await this.page.waitForTimeout(2000);

    const connectButton = this.page.getByTestId('dapp-connect-approve-btn');

    await connectButton.click();
  }
}
