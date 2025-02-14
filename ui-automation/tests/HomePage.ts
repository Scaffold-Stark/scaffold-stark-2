import { Page } from "playwright";

export class HomePage {
  private page: Page;
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
}
