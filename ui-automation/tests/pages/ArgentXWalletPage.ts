import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { navigateAndWait } from "../utils/navigate";

export class ArgentXWalletPage extends BasePage {
  private extensionId: string;

  private preDefinedSeed: string[] = [
    "race", "tilt", "clap", "snake", "buzz", "asthma", "satisfy", "monitor", "aisle", "drastic", "alcohol", "attack"
  ];

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

  async restoreWallet(password: string) {
    await this.safeClick(
      this.getButton("Restore an existing wallet"),
      "Restore wallet button"
    );

    await this.acceptTerms();

    for (let i = 0; i < 12; i++) {
      await this.safeFill(
        this.page.getByTestId(`seed-input-${i}`),
        this.preDefinedSeed[i],
        `Seed input ${i}`
      );
    }

    await this.safeClick(
      this.getButton("Continue"),
      "Continue button"
    );
    
    await this.setPassword(password);

    await this.safeClick(
      this.getButton("Continue"),
      "Continue button"
    );

    await navigateAndWait(this.page, `chrome-extension://${this.extensionId}/index.html`);
  }

  async changeDevnetUrl(url: string) {
    await this.safeClick(
      this.page.getByRole('button', { name: 'Show settings' }),
      "Show settings button"
    );

    await this.safeClick(
      this.page.locator('text=/Advanced settings/i'),
      "Advanced settings button"
    );

    await this.safeClick(
      this.page.locator('text=/Manage networks/i'),
      "Manage networks button"
    );
    
    await this.safeClick(
      this.page.locator('text=/Devnet/i'),
      "Devnet button"
    );

    await this.safeFill(
      this.page.locator('input[name="rpcUrl"]'),
      url,
      "RPC URL input"
    );

    await this.safeClick(
      this.page.getByRole('button', { name: 'Save' }),
      "Save button"
    );

    await this.safeClick(
      this.page.getByRole('button', { name: 'Back' }),
      "Back button"
    );

    await this.safeClick(
      this.page.getByRole('button', { name: 'Back' }),
      "Back button"
    );
  
    await this.safeClick(
      this.page.getByRole('button', { name: 'Close' }),
      "Close button"
    );
  }

  async switchToTestnet() {
    await this.safeClick(
      this.page.getByRole('button', { name: 'Show account list' }),
      "Show account list button"
    );

    await this.safeClick(
      this.page.getByTestId('network-switcher-button'),
      "Network switcher button"
    );

    await this.safeClick(
      this.page.getByTestId('Sepolia'),
      "Devnet button"
    );

    const accountSelectButton = this.page.getByTestId('description');

    if (!(await accountSelectButton.isVisible())) {
      await this.safeClick(
        this.page.getByTestId('create-account-button'),
        "Create account button"
      );

      await this.selectStandardAccount();
      
      await this.clickContinue();  

      await this.page.waitForTimeout(1000);

      await this.safeClick( 
        accountSelectButton,
        "Account Select Button"
      );
    } else {
      await this.safeClick( 
        accountSelectButton,
        "Account Select Button"
      );
    }
  }

  async fundAccountInDevnet() {
    await this.safeClick(
      this.page.getByRole("button", { name: "Fund" }),
      "Fund button"
    );

    await this.safeClick(
      this.page.getByRole("button", { name: "Mint Ethereum and Stark" }),
      "Mint Ethereum and Stark button"
    );
  }

  async clickConfirmTransaction() {
    await this.safeClick(
      this.page.getByRole("button", { name: "Confirm" }),
      "Confirm button"
    );
  }
}