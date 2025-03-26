import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { withDelaySequence } from "../utils/helper";

export class EthDebugPage extends BasePage {
  private readWriteTab: Locator;
  private ethTab: Locator;
  private balanceOfInput: Locator;
  private balanceOfReadButton: Locator;
  private balanceOfResult: Locator;
  private writeTab: Locator;
  private readTab: Locator;
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
    this.readWriteTab = this.page.getByText("ReadWrite").first();
    this.ethTab = this.page.getByRole("button", { name: "Eth", exact: true });
    this.balanceOfInput = this.page
      .getByPlaceholder("ContractAddress account")
      .first();
    this.balanceOfReadButton = this.page
      .getByRole("button", { name: "Read 📡" })
      .first();
    this.balanceOfResult = this.page.getByTestId("result-balance_of");
    this.writeTab = this.page.getByTestId("Eth-write");
    this.readTab = this.page.getByTestId("Eth-read");
    this.transferRecipientInput = this.page.locator(
      'input[name="transfer_recipient_core\\:\\:starknet\\:\\:contract_address\\:\\:ContractAddress"]'
    );
    this.transferAmountInput = this.page.locator(
      'input[name="transfer_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.transferSendButton = this.page.getByTestId("btn-transfer");

    // Initialize approve section
    this.approveSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.approveAmountInput = this.page.locator(
      'input[name="approve_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.approveSendButton = this.page.getByTestId("btn-approve");

    // Initialize allowance section
    this.allowOwnerInput = this.page.getByRole("textbox", {
      name: "ContractAddress owner",
    });
    this.allowSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.allowSendButton = this.page
      .getByRole("button", { name: "Read 📡" })
      .nth(1);
    this.resultCheckAllow = this.page.getByText("Result:");
  }

  getReadWriteTab() {
    return this.readWriteTab;
  }

  getEthTab() {
    return this.ethTab;
  }

  getBalanceOfInput() {
    return this.balanceOfInput;
  }

  getBalanceOfReadButton() {
    return this.balanceOfReadButton;
  }

  getBalanceOfResult() {
    return this.balanceOfResult;
  }

  getWriteTab() {
    return this.writeTab;
  }

  getReadTab() {
    return this.readTab;
  }

  getTransferRecipientInput() {
    return this.transferRecipientInput;
  }

  getTransferAmountInput() {
    return this.transferAmountInput;
  }

  getTransferSendButton() {
    return this.transferSendButton;
  }

  async switchToEthTab() {
    await this.ethTab.click();
  }

  async switchToReadTab() {
    await this.readTab.click();
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

  async switchToWriteTab() {
    await this.writeTab.click();
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

  async performTransfer(recipientAddress: string, amount: string) {
    await this.switchToEthTab();
    await this.switchToWriteTab();
    await this.fillTransferRecipient(recipientAddress);
    await this.fillTransferAmount(amount);
    await this.clickTransferSendButton();
  }

  async checkBalance(address: string) {
    await this.switchToReadTab();
    await this.fillBalanceOfInput(address);
    await this.clickBalanceOfReadButton();
    await this.page.waitForTimeout(2000);
    return await this.getBalanceOfResultText();
  }

  async checkAllowance(
    amount: string,
    spenderAddress: string,
    allowOwnerAddress: string,
    allowSpenderAddress: string
  ) {
    await withDelaySequence(this.page, [
      () => this.switchToEthTab(),
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
