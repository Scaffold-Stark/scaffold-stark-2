import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";

export class StrkDebugPage extends BasePage {
  private strkTab: Locator;
  private balanceOfInput: Locator;
  private balanceOfReadButton: Locator;
  private balanceOfResult: Locator;
  private writeTab: Locator;
  private readTab: Locator;
  private transferRecipientInput: Locator;
  private transferAmountInput: Locator;
  private transferSendButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.strkTab = this.page.getByRole('button', { name: 'Strk', exact: true });
    this.balanceOfInput = this.page.getByPlaceholder('ContractAddress account').nth(2);
    this.balanceOfReadButton = this.page.getByRole('button', { name: 'Read 📡' }).nth(1);
    this.balanceOfResult = this.page.getByText('Result:Ξ');
    this.writeTab = this.page.getByText('Write').nth(1);
    this.readTab = this.page.getByText('Read').nth(1);
    this.transferRecipientInput = this.page.locator('input[placeholder="ContractAddress recipient"]').nth(1);
    this.transferAmountInput = this.page.locator('input[placeholder="u256 amount"]').nth(1);
    this.transferSendButton = this.page.getByText('Send').nth(1);
  }

  getStrkTab() {
    return this.strkTab;
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

  async switchToStrkTab() {
    await this.strkTab.click();
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
    await this.switchToWriteTab();
    await this.fillTransferRecipient(recipientAddress);
    await this.fillTransferAmount(amount);
    await this.clickTransferSendButton();
  }
}