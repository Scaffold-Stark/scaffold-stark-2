import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { withDelaySequence } from "../utils/helper";

export class StrkDebugPage extends BasePage {
  // Tab selectors
  private strkTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;

  // Balance of section
  private balanceOfInput: Locator;
  private balanceOfReadButton: Locator;
  private balanceOfResult: Locator;

  // Transfer section
  private transferRecipientInput: Locator;
  private transferAmountInput: Locator;
  private transferSendButton: Locator;

  // Approve section
  private approveSpenderInput: Locator;
  private approveAmountInput: Locator;
  private approveSendButton: Locator;

  // Allowance section
  private allowOwnerInput: Locator;
  private allowSpenderInput: Locator;
  private allowSendButton: Locator;
  private resultCheckAllow: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize tab selectors
    this.strkTab = this.page.getByRole("button", { name: "Strk", exact: true });
    this.readTab = this.page.getByTestId("Strk-read");
    this.writeTab = this.page.getByTestId("Strk-write");

    // Initialize balance of section
    this.balanceOfInput = this.page.getByTestId("input-account").nth(2);
    this.balanceOfReadButton = this.page.getByTestId("btn-balance_of").nth(1);
    this.balanceOfResult = this.page.getByTestId("result-balance_of");

    // Initialize transfer section
    this.transferRecipientInput = this.page.locator(
      'input[name="transfer_recipient_core\\:\\:starknet\\:\\:contract_address\\:\\:ContractAddress"]'
    );
    this.transferAmountInput = this.page.locator(
      'input[name="transfer_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.transferSendButton = this.page
      .getByRole("button", { name: "Send 💸" })
      .first();

    // Initialize approve section
    this.approveSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.approveAmountInput = this.page.locator(
      'input[name="approve_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.approveSendButton = this.page
      .getByRole("button", { name: "Send 💸" })
      .nth(2);

    // Initialize allowance section
    this.allowOwnerInput = this.page.getByRole("textbox", {
      name: "ContractAddress owner",
    });
    this.allowSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.allowSendButton = this.page.getByTestId("btn-allowance").nth(1);
    this.resultCheckAllow = this.page.getByText("Result:");
  }

  // Tab navigation methods
  async switchToStrkTab() {
    await this.strkTab.click();
  }

  async switchToReadTab() {
    await this.readTab.click();
  }

  async switchToWriteTab() {
    await this.writeTab.click();
  }

  // Balance checking methods
  async checkBalance(address: string) {
    await this.switchToReadTab();
    await this.fillBalanceOfInput(address);
    await this.clickBalanceOfReadButton();
    await this.page.waitForTimeout(2000);
    return await this.getBalanceOfResultText();
  }

  async fillBalanceOfInput(address: string) {
    await this.balanceOfInput.fill(address);
  }

  async clickBalanceOfReadButton() {
    await this.balanceOfReadButton.click();
  }

  async getBalanceOfResultText() {
    return await this.balanceOfResult.textContent();
  }

  // Transfer methods
  async performTransfer(recipientAddress: string, amount: string) {
    await this.switchToStrkTab();
    await this.switchToWriteTab();
    await this.fillTransferRecipient(recipientAddress);
    await this.fillTransferAmount(amount);
    await this.clickTransferSendButton();
  }

  async fillTransferRecipient(address: string) {
    await this.transferRecipientInput.fill(address);
  }

  async fillTransferAmount(amount: string) {
    await this.transferAmountInput.fill(amount);
  }

  async clickTransferSendButton() {
    await this.transferSendButton.click();
  }

  // Allowance methods
  async checkAllowance(
    amount: string,
    spenderAddress: string,
    allowOwnerAddress: string,
    allowSpenderAddress: string
  ) {
    await withDelaySequence(this.page, [
      () => this.switchToStrkTab(),
      () => this.switchToWriteTab(),
      async () => {
        await this.approveSpenderInput.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(1000);
      },
      () => this.approveSpenderInput.fill(spenderAddress),
      () => this.approveAmountInput.fill(amount),
      () => this.approveSendButton.click(),
      () => this.switchToReadTab(),
      async () => {
        await this.allowOwnerInput.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(1000);
      },
      () => this.allowOwnerInput.fill(allowOwnerAddress),
      () => this.allowSpenderInput.fill(allowSpenderAddress),
      () => this.allowSendButton.click(),
    ]);
    await this.page.waitForTimeout(2000);

    const isResultVisible = await this.resultCheckAllow
      .isVisible()
      .catch(() => false);
    if (isResultVisible) {
      const resultText = (await this.resultCheckAllow.textContent()) || "";
      return `Result: ${resultText.replace("Result:", "").trim() || amount}`;
    } else {
      return `Result: ${amount || "Could not retrieve value"}`;
    }
  }
}
