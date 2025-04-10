import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";
import { captureError } from "../utils/error-handler";

export interface InputConfig {
  keyInput: Locator;
  valueInput: Locator;
  sendButton: Locator;
  readValueInput: Locator;
  readButton: Locator;
  readResultValue: Locator;
}

export interface TestResult {
  success: boolean;
  actualValue: string;
  error?: string;
  details?: any;
  name?: string;
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
        sendButton: this.page.getByTestId("btn-set_u256_with_key"),
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
        sendButton: this.page.getByTestId("btn-set_felt_with_key"),
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
        sendButton: this.page.getByTestId("btn-set_byte_array_with_key"),
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
        sendButton: this.page.getByTestId("btn-set_contract_address_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_contract_address_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_contract_address_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_contract_address_with_key"
        ),
      },
      bool: {
        keyInput: this.page.locator(
          'input[name="set_bool_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("bool value"),
        sendButton: this.page.getByTestId("btn-set_bool_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_bool_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_bool_with_key"),
        readResultValue: this.page.getByTestId("result-get_bool_with_key"),
      },
      bytes31: {
        keyInput: this.page.locator(
          'input[name="set_bytes31_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("bytes31 value"),
        sendButton: this.page.getByTestId("btn-set_bytes31_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_bytes31_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_bytes31_with_key"),
        readResultValue: this.page.getByTestId("result-get_bytes31_with_key"),
      },
      i128: {
        keyInput: this.page.locator(
          'input[name="set_i128_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("i128 value"),
        sendButton: this.page.getByTestId("btn-set_i128_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_i128_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_i128_with_key"),
        readResultValue: this.page.getByTestId("result-get_i128_with_key"),
      },
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToVarsTab() {
    const isVisible = await this.varsTab.isVisible().catch(() => false);
    if (!isVisible) {
      throw new Error("Vars tab not found or not visible");
    }
    await this.safeClick(this.varsTab, "Vars tab");
  }
  async switchToReadTab() {
    await this.safeClick(this.readTab, "Read tab");
  }

  async switchToWriteTab() {
    await this.safeClick(this.writeTab, "Write tab");
  }

  /**
   * Checks if a transaction completed successfully
   * @returns Object with success status and optional error message
   */
  async isTransactionCompleted(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const toastVisible = await this.transaction_completed
        .isVisible({ timeout: 1000 })
        .catch((e) => {
          console.warn(
            "Toast visibility check failed:",
            e instanceof Error ? e.message : String(e)
          );
          return false;
        });

      if (toastVisible) {
        return { success: true };
      }

      await this.page.waitForTimeout(2000);

      const errorLocator = this.page.getByText(/error|failed|failure/i);
      const errorVisible = await errorLocator.isVisible().catch((e) => {
        console.warn(
          "Error check failed:",
          e instanceof Error ? e.message : String(e)
        );
        return false;
      });

      if (errorVisible) {
        const errorText = (await errorLocator.textContent()) || "Unknown error";
        return { success: false, error: `Transaction error: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to check transaction status: ${errMsg}`,
      };
    }
  }

  /**
   * Sets and sends a felt252 value with the specified key
   * @param key The key identifier for the variable
   * @param value The felt252 value to set
   */
  async setAndSendFelt252(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.felt252;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `felt252 key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        value,
        `felt252 value with ${value}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send felt252 button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendFelt252 with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a felt252 value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readFelt252(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.felt252;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `felt252 read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read felt252 button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "felt252 result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readFelt252 with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a felt252 value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testFelt252(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendFelt252(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "Felt252",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readFelt252(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "Felt252",
        };
      }

      const success = resultText === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "Felt252",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `Felt252 test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "Felt252",
      };
    }
  }

  /**
   * Sets and sends a felt value with the specified key
   * @param key The key identifier for the variable
   * @param value The felt value to set
   */
  async setAndSendFelt(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.felt;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `felt key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(config.valueInput, value, `felt value with ${value}`);

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send felt button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendFelt with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a felt value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readFelt(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.felt;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `felt read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read felt button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "felt result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readFelt with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a felt value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testFelt(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendFelt(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "Felt",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readFelt(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "Felt",
        };
      }

      const success = resultText === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "Felt",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `Felt test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "Felt",
      };
    }
  }

  /**
   * Sets and sends a ByteArray value with the specified key
   * @param key The key identifier for the variable
   * @param value The ByteArray value to set
   */
  async setAndSendByteArray(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.byteArray;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `byteArray key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        value,
        `byteArray value with ${value}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send byteArray button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendByteArray with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a ByteArray value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readByteArray(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.byteArray;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `byteArray read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read byteArray button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "byteArray result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readByteArray with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a ByteArray value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testByteArray(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendByteArray(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "ByteArray",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readByteArray(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "ByteArray",
        };
      }

      const cleanedResult = resultText.replace(/^"(.*)"$/, "$1");
      const success = cleanedResult === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${cleanedResult}"`,
        details: {
          key,
          expectedValue: value,
          actualValue: resultText,
          cleanedValue: cleanedResult,
        },
        name: "ByteArray",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `ByteArray test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "ByteArray",
      };
    }
  }

  /**
   * Sets and sends a ContractAddress value with the specified key
   * @param key The key identifier for the variable
   * @param address The ContractAddress value to set
   */
  async setAndSendContractAddress(key: string, address: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.contractAddress;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(
        config.keyInput,
        key,
        `contractAddress key with ${key}`
      );

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        address,
        `contractAddress value with ${address}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send contractAddress button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendContractAddress with key=${key}, address=${address}`
      );
      throw error;
    }
  }

  /**
   * Reads a ContractAddress value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readContractAddress(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.contractAddress;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `contractAddress read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read contractAddress button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "contractAddress result"
      );
      return resultText;
    } catch (error) {
      await captureError(
        this.page,
        error,
        `readContractAddress with key=${key}`
      );
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a ContractAddress value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testContractAddress(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendContractAddress(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "ContractAddress",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readContractAddress(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "ContractAddress",
        };
      }

      const success = resultText ? true : false;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value empty or invalid, expected address format`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "ContractAddress",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `ContractAddress test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "ContractAddress",
      };
    }
  }

  /**
   * Sets and sends a Boolean value with the specified key
   * @param key The key identifier for the variable
   * @param bool The Boolean value to set ("true" or "false")
   */
  async setAndSendBool(key: string, bool: "true" | "false") {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.bool;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `bool key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(config.valueInput, bool, `bool value with ${bool}`);

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send bool button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendBool with key=${key}, bool=${bool}`
      );
      throw error;
    }
  }

  /**
   * Reads a Boolean value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readBool(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.bool;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `bool read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read bool button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "bool result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readBool with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a Boolean value
   * @param key The key identifier for the variable
   * @param value The value to test ("true" or "false")
   * @returns TestResult with success status and relevant information
   */
  async testBool(key: string, value: "true" | "false"): Promise<TestResult> {
    try {
      await this.setAndSendBool(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "Bool",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readBool(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "Bool",
        };
      }

      const success = resultText === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "Bool",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `Bool test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "Bool",
      };
    }
  }

  /**
   * Sets and sends a Bytes31 value with the specified key
   * @param key The key identifier for the variable
   * @param value The bytes31 value to set
   */
  async setAndSendBytes31(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.bytes31;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `bytes31 key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        value,
        `bytes31 value with ${value}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send bytes31 button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendBytes31 with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a Bytes31 value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readBytes31(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.bytes31;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `bytes31 read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read bytes31 button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "bytes31 result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readBytes31 with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a Bytes31 value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testBytes31(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendBytes31(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "Bytes31",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readBytes31(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "Bytes31",
        };
      }

      const success = resultText === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "Bytes31",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `Bytes31 test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "Bytes31",
      };
    }
  }

  /**
   * Sets and sends an i128 value with the specified key
   * @param key The key identifier for the variable
   * @param value The i128 value to set
   */
  async setAndSendI128(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.i128;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `i128 key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(config.valueInput, value, `i128 value with ${value}`);

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send i128 button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendI128 with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads an i128 value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readI128(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.i128;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `i128 read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read i128 button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "i128 result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readI128 with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading an i128 value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testI128(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendI128(key, value);

      await this.page.waitForTimeout(5000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "I128",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readI128(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "I128",
        };
      }

      const success = resultText === value;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: { key, expectedValue: value, actualValue: resultText },
        name: "I128",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `I128 test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "I128",
      };
    }
  }
}
