import { Page } from "playwright";
import { BasePage } from "./BasePage";

export class DebugPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getWriteTab() {
    return this.page
      .locator('div:not([class*="hidden"]) .tabs a.tab', {
        hasText: "Write",
      })
      .first();
  }
}
