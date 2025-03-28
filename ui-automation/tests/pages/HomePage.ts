import { Page } from "playwright";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getDebugPageLinkButton() {
    return this.page
      .locator("li")
      .filter({ hasText: "Debug Contracts" })
      .getByRole("link");
  }
}
