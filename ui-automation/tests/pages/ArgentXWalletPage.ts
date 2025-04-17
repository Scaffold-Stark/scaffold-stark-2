import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { navigateAndWait } from "../utils/navigate";

export class ArgentXWalletPage extends BasePage {
  private extensionId: string;

  constructor(page: Page) {
    super(page);
    this.extensionId = page.url().split('/')[2];
  }

  getButton(name: string){
    return this.page.locator(`button:has-text("${name}")`);
  }

  /**
   * Creates a new Argent X wallet
   * @param password The password to set for the wallet
   */
  async createNewWallet(password: string) {
    await this.safeClick(
      this.getButton("Create a new wallet"),
      "Create new wallet button"
    );

    await this.safeClick(
      this.getButton("I agree"),
      "Agree button"
    );

    await this.safeFill(
      this.page.locator('input[placeholder="Password"]'),
      password,
      "Password input"
    );

    await this.safeFill(
      this.page.locator('input[placeholder="Repeat password"]'),
      password,
      "Repeat password input"
    );

    await this.safeClick(
      this.getButton("Continue"),
      "Continue button"
    );

    await this.safeClick(
      this.getButton("Standard Account"),
      "Standard Account button"
    );

    await this.safeClick(
      this.getButton("Continue"),
      "Continue button"
    );

    await navigateAndWait(this.page, `chrome-extension://${this.extensionId}/index.html`);
  }

  async acceptTerms() {
    await this.safeClick(
      this.getButton("I agree"),
      "I agree button"
    );
  }

  async setPassword(password: string) {
    const passwordInput = this.page.locator('input[placeholder="Password"]');
    const repeatPasswordInput = this.page.locator('input[placeholder="Repeat password"]');
    
    await this.safeFill(passwordInput, password, "Password input");
    await this.safeFill(repeatPasswordInput, password, "Repeat password input");
  }

  async clickContinue() {
    await this.safeClick(
      this.getButton("Continue"),
      "Continue button"
    );
  }

  async selectStandardAccount() {
    await this.safeClick(
      this.getButton("Standard Account"),
      "Standard Account button"
    );
  }

  /**
   * Checks if the connection dialog is visible
   * @returns Promise<boolean> indicating if the connection dialog is visible
   */
  async isConnectionDialogVisible(): Promise<boolean> {
    try {
      const dialog = this.page.locator("text=/Connect to dapp/i");
      return await dialog.isVisible({ timeout: 10000 });
    } catch (error) {
      return false;
    }
  }

  async clickConnect() {
    await this.safeClick(
      this.page.getByRole('button', { name: 'Connect' }),
      "Connect button"
    );
  }
}
