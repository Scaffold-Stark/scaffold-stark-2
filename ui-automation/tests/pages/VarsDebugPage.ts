import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";

export interface InputConfig {
  keyInput: Locator;
  valueInput: Locator;
  sendButton: Locator;
  readValueInput: Locator;
  readButton: Locator;
  readResultValue: Locator;
}

export class VarsDebugPage extends BasePage {
  private varsTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;

  private transaction_completed: Locator;

  private inputConfigs: Record<string, InputConfig>;

  constructor(page: Page) {
    super(page);
    this.varsTab = this.page.getByRole("button", { name: "Vars" });
    this.readTab = this.page.getByTestId("Vars-read");
    this.writeTab = this.page.getByTestId("Vars-write");

    this.transaction_completed = this.page.getByText("🎉Transaction completed");

    this.inputConfigs = {
      felt252: {
        keyInput: this.page.locator(
          'input[name="set_u256_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("u256 value"),
        sendButton: this.page.getByTestId('btn-set_u256_with_key'),
        readValueInput: this.page.locator(
          'input[name="get_u256_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_u256_with_key"),
        readResultValue: this.page.getByTestId("result-get_u256_with_key"),
      },
      felt: {
        keyInput: this.page.locator(
          'input[name="set_felt_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("felt252 value"),
        sendButton: this.page.getByTestId('btn-set_felt_with_key'),
        readValueInput: this.page.locator(
          'input[name="get_felt_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_felt_with_key"),
        readResultValue: this.page.getByTestId("result-get_felt_with_key"),
      },
      byteArray: {
        keyInput: this.page.locator(
          'input[name="set_byte_array_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("ByteArray value"),
        sendButton: this.page.getByTestId('btn-set_byte_array_with_key'),
        readValueInput: this.page.locator(
          'input[name="get_byte_array_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_byte_array_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_byte_array_with_key"
        ),
      },
      contractAddress: {
        keyInput: this.page.locator(
          'input[name="set_contract_address_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("ContractAddress value"),
        sendButton: this.page.getByTestId('btn-set_contract_address_with_key'),
        readValueInput: this.page.locator(
          'input[name="get_contract_address_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_contract_address_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_contract_address_with_key"
        ),
      },
      bool: {
        keyInput: this.page.locator('input[name="set_bool_with_key_key_core\\:\\:felt252"]'),
        valueInput: this.page.getByPlaceholder('bool value'),
        sendButton: this.page.getByTestId('btn-set_bool_with_key'),
        readValueInput: this.page.locator(
          'input[name="get_bool_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_bool_with_key"),
        readResultValue: this.page.getByTestId("result-get_bool_with_key"),
      },
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToVarsTab() {
    await this.varsTab.click();
  }

  async switchToReadTab() {
    await this.readTab.click();
  }

  async switchToWriteTab() {
    await this.writeTab.click();
  }

  async setAndSendFelt252(key: string, value: string) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.felt252;
    await this.scrollToElement(config.keyInput);
    await config.keyInput.fill(key);

    await this.scrollToElement(config.valueInput);
    await config.valueInput.fill(value);

    await this.scrollToElement(config.sendButton);
    await config.sendButton.click();
  }

  async setAndSendFelt(key: string, value: string) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.felt;
    await this.scrollToElement(config.keyInput);
    await config.keyInput.fill(key);

    await this.scrollToElement(config.valueInput);
    await config.valueInput.fill(value);

    await this.scrollToElement(config.sendButton);
    await config.sendButton.click();
  }

  async setAndSendByteArray(key: string, value: string) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.byteArray;
    await this.scrollToElement(config.keyInput);
    await config.keyInput.fill(key);

    await this.scrollToElement(config.valueInput);
    await config.valueInput.fill(value);

    await this.scrollToElement(config.sendButton);
    await config.sendButton.click();
  }

  async setAndSendContractAddress(key: string, address: string) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.contractAddress;
    await this.scrollToElement(config.keyInput);
    await config.keyInput.fill(key);

    await this.scrollToElement(config.valueInput);
    await config.valueInput.fill(address);

    await this.scrollToElement(config.sendButton);
    await config.sendButton.click();
  }

  async setAndSendBool(key: string, bool: "true" | "false") {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.bool;
    await this.scrollToElement(config.keyInput);
    await config.keyInput.fill(key);

    await this.scrollToElement(config.valueInput);
    await config.valueInput.fill(bool);

    await this.scrollToElement(config.sendButton);
    await config.sendButton.click();
  }

  async readFelt252(key: string): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.felt252;
    await this.scrollToElement(config.readValueInput);
    await config.readValueInput.fill(key);

    await this.scrollToElement(config.readButton);
    await config.readButton.click();

    await this.page.waitForTimeout(1000);

    await this.scrollToElement(config.readResultValue);
    const resultText = await config.readResultValue.textContent();
    return resultText || "";
  }

  async readFelt(key: string): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.felt;
    await this.scrollToElement(config.readValueInput);
    await config.readValueInput.fill(key);

    await this.scrollToElement(config.readButton);
    await config.readButton.click();

    await this.page.waitForTimeout(1000);

    await this.scrollToElement(config.readResultValue);
    const resultText = await config.readResultValue.textContent();
    return resultText || "";
  }

  async readByteArray(key: string): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.byteArray;
    await this.scrollToElement(config.readValueInput);
    await config.readValueInput.fill(key);

    await this.scrollToElement(config.readButton);
    await config.readButton.click();

    await this.page.waitForTimeout(1000);

    await this.scrollToElement(config.readResultValue);
    const resultText = await config.readResultValue.textContent();
    return resultText || "";
  }

  async readContractAddress(key: string): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.contractAddress;
    await this.scrollToElement(config.readValueInput);
    await config.readValueInput.fill(key);

    await this.scrollToElement(config.readButton);
    await config.readButton.click();

    await this.page.waitForTimeout(1000);

    await this.scrollToElement(config.readResultValue);
    const resultText = await config.readResultValue.textContent();
    return resultText || "";
  }

  async readBool(key: string): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.bool;
    await this.scrollToElement(config.readValueInput);
    await config.readValueInput.fill(key);

    await this.scrollToElement(config.readButton);
    await config.readButton.click();

    await this.page.waitForTimeout(1000);

    await this.scrollToElement(config.readResultValue);
    const resultText = await config.readResultValue.textContent();
    return resultText || "";
  }

  async isTransactionCompleted(): Promise<boolean> {
    try {
      const toastVisible = await this.transaction_completed
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (toastVisible) {
        return true;
      }

      await this.page.waitForTimeout(2000);

      const errorVisible = await this.page
        .getByText(/error|failed|failure/i)
        .isVisible()
        .catch(() => false);
      if (errorVisible) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async testFelt252(
    key: string,
    value: string
  ): Promise<{ success: boolean; actualValue: string }> {
    await this.setAndSendFelt252(key, value);

    await this.page.waitForTimeout(5000);
    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) {
      return { success: false, actualValue: "" };
    }

    const resultText = await this.readFelt252(key);
    return {
      success: resultText === value,
      actualValue: resultText,
    };
  }

  async testFelt(
    key: string,
    value: string
  ): Promise<{ success: boolean; actualValue: string }> {
    await this.setAndSendFelt(key, value);

    await this.page.waitForTimeout(5000);
    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) {
      return { success: false, actualValue: "" };
    }

    const resultText = await this.readFelt(key);
    return {
      success: resultText === value,
      actualValue: resultText,
    };
  }

  async testByteArray(
    key: string,
    value: string
  ): Promise<{ success: boolean; actualValue: string }> {
    await this.setAndSendByteArray(key, value);

    await this.page.waitForTimeout(5000);
    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) {
      return { success: false, actualValue: "" };
    }

    const resultText = await this.readByteArray(key);

    const cleanedResult = resultText.replace(/^"(.*)"$/, "$1");

    return {
      success: cleanedResult === value,
      actualValue: resultText,
    };
  }

  async testContractAddress(
    key: string,
    value: string
  ): Promise<{ success: boolean; actualValue: string }> {
    await this.setAndSendContractAddress(key, value);

    await this.page.waitForTimeout(5000);
    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) {
      return { success: false, actualValue: "" };
    }

    const resultText = await this.readContractAddress(key);
    return {
      success: resultText ? true : false,
      actualValue: resultText,
    };
  }

  async testBool(
    key: string,
    value: "true" | "false"
  ): Promise<{ success: boolean; actualValue: string }> {
    await this.setAndSendBool(key, value);

    await this.page.waitForTimeout(5000);
    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) {
      return { success: false, actualValue: "" };
    }

    const resultText = await this.readBool(key);
    return {
      success: resultText === value,
      actualValue: resultText,
    };
  }
}
