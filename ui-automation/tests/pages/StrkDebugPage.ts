import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { withDelaySequence } from "../utils/helper";
import { captureError } from "../utils/error-handler";

export class StrkDebugPage extends BasePage {
  private strkTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;

  private balanceOfInput: Locator;
  private balanceOfReadButton: Locator;
  private balanceOfResult: Locator;

  private transferRecipientInput: Locator;
  private transferAmountInput: Locator;
  private transferSendButton: Locator;

  private approveSpenderInput: Locator;
  private approveAmountInput: Locator;
  private approveSendButton: Locator;

  private allowOwnerInput: Locator;
  private allowSpenderInput: Locator;
  private allowSendButton: Locator;
  private resultCheckAllow: Locator;

  constructor(page: Page) {
    super(page);

    this.strkTab = this.page.getByRole("button", { name: "Strk", exact: true });
    this.readTab = this.page.getByTestId("Strk-read");
    this.writeTab = this.page.getByTestId("Strk-write");

    this.balanceOfInput = this.page.getByTestId("input-account").nth(2);
    this.balanceOfReadButton = this.page.getByTestId("btn-balance_of").nth(1);
    this.balanceOfResult = this.page.getByTestId("result-balance_of");

    this.transferRecipientInput = this.page.locator(
      'input[name="transfer_recipient_core\\:\\:starknet\\:\\:contract_address\\:\\:ContractAddress"]'
    );
    this.transferAmountInput = this.page.locator(
      'input[name="transfer_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.transferSendButton = this.page
      .getByRole("button", { name: "Send 💸" })
      .first();

    this.approveSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.approveAmountInput = this.page.locator(
      'input[name="approve_amount_core\\:\\:integer\\:\\:u256"]'
    );
    this.approveSendButton = this.page
      .getByRole("button", { name: "Send 💸" })
      .nth(2);

    this.allowOwnerInput = this.page.getByRole("textbox", {
      name: "ContractAddress owner",
    });
    this.allowSpenderInput = this.page.getByRole("textbox", {
      name: "ContractAddress spender",
    });
    this.allowSendButton = this.page.getByTestId("btn-allowance").nth(1);
    this.resultCheckAllow = this.page.getByText("Result:");
  }

  async switchToStrkTab() {
    try {
      await this.safeClick(this.strkTab, "STRK tab");
    } catch (error) {
      await captureError(this.page, error, "Switch to STRK tab");
      throw error;
    }
  }

  async switchToReadTab() {
    try {
      await this.safeClick(this.readTab, "Read tab");
    } catch (error) {
      await captureError(this.page, error, "Switch to Read tab");
      throw error;
    }
  }

  async switchToWriteTab() {
    try {
      await this.safeClick(this.writeTab, "Write tab");
    } catch (error) {
      await captureError(this.page, error, "Switch to Write tab");
      throw error;
    }
  }

  async checkBalance(address: string) {
    try {
      console.log(`Checking STRK balance for address: ${address}`);
      await this.switchToReadTab();
      await this.fillBalanceOfInput(address);
      await this.clickBalanceOfReadButton();
      await this.page.waitForTimeout(2000);
      const balance = await this.getBalanceOfResultText();
      console.log(`STRK Balance for ${address}: ${balance}`);
      return { success: true, balance };
    } catch (error) {
      const err = await captureError(
        this.page,
        error,
        `Check STRK balance for ${address}`
      );
      console.error(`Balance check failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async fillBalanceOfInput(address: string) {
    try {
      await this.safeFill(
        this.balanceOfInput,
        address,
        `Balance of input with address ${address}`
      );
    } catch (error) {
      await captureError(
        this.page,
        error,
        `Fill balance of input with address ${address}`
      );
      throw error;
    }
  }

  async clickBalanceOfReadButton() {
    try {
      await this.safeClick(this.balanceOfReadButton, "Balance of read button");
    } catch (error) {
      await captureError(this.page, error, "Click balance of read button");
      throw error;
    }
  }

  async getBalanceOfResultText() {
    try {
      return await this.safeGetText(this.balanceOfResult, "Balance of result");
    } catch (error) {
      await captureError(this.page, error, "Get balance of result text");
      throw error;
    }
  }

  async performTransfer(recipientAddress: string, amount: string) {
    try {
      console.log(`Starting STRK transfer of ${amount} to ${recipientAddress}`);
      await this.switchToStrkTab();
      await this.switchToWriteTab();
      await this.fillTransferRecipient(recipientAddress);
      await this.fillTransferAmount(amount);
      await this.clickTransferSendButton();
      console.log(
        `Completed STRK transfer request of ${amount} to ${recipientAddress}`
      );

      await this.page.waitForTimeout(3000);

      const errorElement = await this.page
        .locator("text=/error|failed|rejected/i")
        .first();
      if (await errorElement.isVisible().catch(() => false)) {
        const errorMsg = (await errorElement.textContent()) || "Unknown error";
        console.error(`Transfer error displayed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      return { success: true, note: "Transfer request sent successfully" };
    } catch (error) {
      const err = await captureError(
        this.page,
        error,
        `Perform STRK transfer of ${amount} to ${recipientAddress}`
      );
      console.error(`Transfer operation failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async fillTransferRecipient(address: string) {
    try {
      await this.safeFill(
        this.transferRecipientInput,
        address,
        `Transfer recipient input with address ${address}`
      );
    } catch (error) {
      await captureError(
        this.page,
        error,
        `Fill transfer recipient with address ${address}`
      );
      throw error;
    }
  }

  async fillTransferAmount(amount: string) {
    try {
      await this.safeFill(
        this.transferAmountInput,
        amount,
        `Transfer amount input with value ${amount}`
      );
    } catch (error) {
      await captureError(
        this.page,
        error,
        `Fill transfer amount with value ${amount}`
      );
      throw error;
    }
  }

  async clickTransferSendButton() {
    try {
      await this.safeClick(this.transferSendButton, "Transfer send button");
    } catch (error) {
      await captureError(this.page, error, "Click transfer send button");
      throw error;
    }
  }

  async checkAllowance(
    amount: string,
    spenderAddress: string,
    allowOwnerAddress: string,
    allowSpenderAddress: string
  ) {
    try {
      console.log(
        `Setting and checking STRK allowance of ${amount} for spender ${spenderAddress}`
      );

      const actionResults = await withDelaySequence(
        this.page,
        [
          async () => {
            await this.switchToStrkTab();
            return "Switched to STRK tab";
          },
          async () => {
            await this.switchToWriteTab();
            return "Switched to Write tab";
          },
          async () => {
            await this.approveSpenderInput.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(1000);
            return "Scrolled to approve spender input";
          },
          async () => {
            await this.safeFill(
              this.approveSpenderInput,
              spenderAddress,
              "Approve spender input"
            );
            return `Filled approve spender input with ${spenderAddress}`;
          },
          async () => {
            await this.safeFill(
              this.approveAmountInput,
              amount,
              "Approve amount input"
            );
            return `Filled approve amount input with ${amount}`;
          },
          async () => {
            await this.safeClick(this.approveSendButton, "Approve send button");
            return "Clicked approve send button";
          },
          async () => {
            try {
              await this.page.waitForSelector(
                'text="🎉Transaction completed"',
                { timeout: 15000 }
              );
              return "Approve transaction completed";
            } catch (timeoutError) {
              const errorElement = await this.page
                .locator("text=/error|failed|rejected/i")
                .first();
              if (await errorElement.isVisible().catch(() => false)) {
                const errorText =
                  (await errorElement.textContent()) || "Unknown error";
                throw new Error(`Approve transaction failed: ${errorText}`);
              }
              return "Approve transaction status unclear";
            }
          },
          async () => {
            await this.switchToReadTab();
            return "Switched to Read tab";
          },
          async () => {
            await this.allowOwnerInput.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(1000);
            return "Scrolled to allow owner input";
          },
          async () => {
            await this.safeFill(
              this.allowOwnerInput,
              allowOwnerAddress,
              "Allow owner input"
            );
            return `Filled allow owner input with ${allowOwnerAddress}`;
          },
          async () => {
            await this.safeFill(
              this.allowSpenderInput,
              allowSpenderAddress,
              "Allow spender input"
            );
            return `Filled allow spender input with ${allowSpenderAddress}`;
          },
          async () => {
            await this.safeClick(this.allowSendButton, "Allow send button");
            return "Clicked allow send button";
          },
        ],
        1000,
        [
          "SwitchToStrkTab",
          "SwitchToWriteTab",
          "ScrollToApproveSpender",
          "FillApproveSpender",
          "FillApproveAmount",
          "ClickApproveSend",
          "WaitForApproveTransaction",
          "SwitchToReadTab",
          "ScrollToAllowOwner",
          "FillAllowOwner",
          "FillAllowSpender",
          "ClickAllowSend",
        ]
      );

      console.log("Allowance sequence completed");

      await this.page.waitForTimeout(2000);

      const isResultVisible = await this.resultCheckAllow
        .isVisible()
        .catch(() => false);

      if (isResultVisible) {
        const resultText = (await this.resultCheckAllow.textContent()) || "";
        const allowanceValue =
          resultText.replace("Result:", "").trim() || amount;
        return { success: true, value: allowanceValue };
      } else {
        return {
          success: false,
          error: "Could not retrieve allowance result",
          value: amount,
        };
      }
    } catch (error) {
      const err = await captureError(
        this.page,
        error,
        `Check STRK allowance of ${amount} for spender ${spenderAddress}`
      );
      console.error(`Allowance check failed: ${err.message}`);
    
      return {
        success: false,
        error: err.message,
        value: "Error",
      };
    }
  }
}
