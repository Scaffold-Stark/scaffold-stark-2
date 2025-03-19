import { Page } from "playwright";

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

  async connectWallet(account: string) {
    const connectButton = await this.getConnectButton();
    await connectButton.click();

    await this.getConnecterButton("Burner Wallet").click();

    const button = this.getAccountButton(account);
    await button.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    await button.click({ force: true, timeout: 5000 });
  }
}