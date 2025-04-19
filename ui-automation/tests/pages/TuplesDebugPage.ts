import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";
import { captureError } from "../utils/error-handler";

interface InputConfig {
  keyInput: Locator;
  valueInput: Locator;
  sendButton: Locator;
  readValueInput: Locator;
  readButton: Locator;
  readResultValue: Locator;
}

interface TestResult {
  success: boolean;
  actualValue: string;
  error?: string;
  details?: any;
  name?: string;
}

export class TuplesDebugPage extends BasePage {
  private tuplesTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private transaction_completed: Locator;
  private inputConfigs: Record<string, InputConfig>;

  constructor(page: Page) {
    super(page);
    this.tuplesTab = this.page.getByRole("button", { name: "Tuples" });
    this.readTab = this.page.getByTestId("Tuples-read");
    this.writeTab = this.page.getByTestId("Tuples-write");
    this.transaction_completed = this.page.getByText("🎉Transaction completed");

    this.inputConfigs = {
      tuple4_mixed: {
        keyInput: this.page.locator(
          'input[name="set_tuple_4_mixed_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("(ContractAddress, felt252,"),
        sendButton: this.page.getByTestId("btn-set_tuple_4_mixed_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_tuple_4_mixed_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_tuple_4_mixed_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_tuple_4_mixed_with_key"
        ),
      },
      tuple_byte_array: {
        keyInput: this.page.locator(
          'input[name="set_tuple_with_byte_array_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByPlaceholder("(ByteArray, felt252, u256)"),
        sendButton: this.page.getByTestId(
          "btn-set_tuple_with_byte_array_with_key"
        ),
        readValueInput: this.page.locator(
          'input[name="get_tuple_with_byte_array_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId(
          "btn-get_tuple_with_byte_array_with_key"
        ),
        readResultValue: this.page.getByTestId(
          "result-get_tuple_with_byte_array_with_key"
        ),
      },
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToTuplesTab() {
    const isVisible = await this.tuplesTab.isVisible().catch(() => false);
    if (!isVisible) {
      throw new Error("Tuples tab not found or not visible");
    }
    await this.safeClick(this.tuplesTab, "Tuples tab");
  }
  async switchToReadTab() {
    await this.safeClick(this.readTab, "Read tab");
  }

  async switchToWriteTab() {
    await this.safeClick(this.writeTab, "Write tab");
  }

  /**
   * Normalizes tuple value for comparison
   * Removes extra spaces, quotes, and standardizes format
   * @param tupleValue The tuple value to normalize
   * @returns Normalized tuple value string
   */
  private normalizeTupleValue(tupleValue: string): string {
    let normalized = tupleValue.replace(/\s+/g, "");
    normalized = normalized.replace(/^["']|["']$/g, "");
    normalized = normalized.toLowerCase();

    return normalized;
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
   * Sets and sends a tuple4_mixed value with the specified key
   * @param key The key identifier for the variable
   * @param value The tuple4_mixed value to set
   */
  async setAndSendTuple4Mixed(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.tuple4_mixed;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `tuple4_mixed key with ${key}`);

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        value,
        `tuple4_mixed value with ${value}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send tuple4_mixed button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendTuple4Mixed with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a tuple4_mixed value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readTuple4Mixed(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.tuple4_mixed;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `tuple4_mixed read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read tuple4_mixed button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "tuple4_mixed result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readTuple4Mixed with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a tuple4_mixed value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testTuple4Mixed(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendTuple4Mixed(key, value);

      await this.page.waitForTimeout(3000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "Tuple4Mixed",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readTuple4Mixed(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "Tuple4Mixed",
        };
      }

      const normalizedResult = this.normalizeTupleValue(resultText);
      const normalizedExpected = this.normalizeTupleValue(value);

      const success = normalizedResult === normalizedExpected;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: {
          key,
          expectedValue: value,
          actualValue: resultText,
          normalizedExpected,
          normalizedResult,
        },
        name: "Tuple4Mixed",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `Tuple4Mixed test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "Tuple4Mixed",
      };
    }
  }

  /**
   * Sets and sends a tuple with byte array value with the specified key
   * @param key The key identifier for the variable
   * @param value The tuple with byte array value to set
   */
  async setAndSendTupleByteArray(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.tuple_byte_array;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(
        config.keyInput,
        key,
        `tuple_byte_array key with ${key}`
      );

      await this.scrollToElement(config.valueInput);
      await this.safeFill(
        config.valueInput,
        value,
        `tuple_byte_array value with ${value}`
      );

      await this.scrollToElement(config.sendButton);
      await this.safeClick(config.sendButton, "send tuple_byte_array button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendTupleByteArray with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a tuple with byte array value by key
   * @param key The key to look up
   * @returns Promise with the variable value as string
   */
  async readTupleByteArray(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.tuple_byte_array;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `tuple_byte_array read key with ${key}`
      );

      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "read tuple_byte_array button");

      await this.page.waitForTimeout(1000);

      await this.scrollToElement(config.readResultValue);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "tuple_byte_array result"
      );
      return resultText;
    } catch (error) {
      await captureError(
        this.page,
        error,
        `readTupleByteArray with key=${key}`
      );
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a tuple with byte array value
   * @param key The key identifier for the variable
   * @param value The value to test
   * @returns TestResult with success status and relevant information
   */
  async testTupleByteArray(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendTupleByteArray(key, value);

      await this.page.waitForTimeout(3000);
      const transactionResult = await this.isTransactionCompleted();

      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, expectedValue: value },
          name: "TupleByteArray",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readTupleByteArray(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read value after setting: ${readErrorMsg}`,
          details: { key, expectedValue: value },
          name: "TupleByteArray",
        };
      }

      // For tuples with ByteArray, we need a more flexible comparison
      // as the output format might include quotes or different spacing
      const normalizedResult = this.normalizeTupleValue(resultText);
      const normalizedExpected = this.normalizeTupleValue(value);

      const success = normalizedResult === normalizedExpected;

      return {
        success,
        actualValue: resultText,
        error: success
          ? undefined
          : `Value mismatch: expected "${value}", got "${resultText}"`,
        details: {
          key,
          expectedValue: value,
          actualValue: resultText,
          normalizedExpected,
          normalizedResult,
        },
        name: "TupleByteArray",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await captureError(
        this.page,
        error,
        `TupleByteArray test with key ${key} and value ${value}`
      );

      return {
        success: false,
        actualValue: "",
        error: `Test execution failed: ${errorMsg}`,
        details: { key, expectedValue: value },
        name: "TupleByteArray",
      };
    }
  }
}
