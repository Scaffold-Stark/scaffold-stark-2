import { Locator, Page } from "playwright";
import { BasePage } from "./BasePage";
import { captureError } from "../utils/error-handler";

interface TestResult {
  success: boolean;
  actualValue: string;
  error?: string;
  details?: any;
  name?: string;
}

export class StructsDebugPage extends BasePage {
  private structsTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private transaction_completed: Locator;
  private inputConfigs: Record<string, any>;

  constructor(page: Page) {
    super(page);

    this.structsTab = this.page.getByRole("button", { name: "Structs" });
    this.readTab = this.page.getByTestId("Structs-read");
    this.writeTab = this.page.getByTestId("Structs-write");
    this.transaction_completed = this.page.getByText("🎉Transaction completed");

    this.inputConfigs = {
      struct: {
        keyInput: this.page.locator(
          'input[name="set_sample_struct_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page
          .getByTestId("click-contracts::types::SampleStruct-field")
          .first(),
        structId: this.page.getByRole("textbox", { name: "u256 id" }),
        structName: this.page.getByRole("textbox", { name: "ByteArray name" }),
        structStatus: this.page
          .getByTestId("click-contracts::types::SampleEnum-field")
          .first(),
        structStatusClick3: this.page
          .getByTestId("radio-contracts::types::SampleEnum-2")
          .first(),
        structStatusEnum3: this.page.getByRole("textbox", {
          name: "ByteArray enum3",
        }),
        sendButton: this.page.getByTestId("btn-set_sample_struct_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_sample_struct_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_sample_struct_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_sample_struct_with_key"
        ),
      },
      nestedStruct: {
        keyInput: this.page.locator(
          'input[name="set_sample_nested_struct_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByTestId(
          "click-contracts::types::SampleNestedStruct-field"
        ),
        structContractAddressUser: this.page.getByTestId("input-user"),
        structData: this.page
          .getByTestId("click-contracts::types::SampleNestedStruct-field")
          .getByTestId("click-contracts::types::SampleStruct-field"),
        structDataValue: {
          structDataId: this.page
            .getByTestId("click-contracts::types::SampleNestedStruct-field")
            .getByPlaceholder("u256 id"),
          structDataName: this.page
            .getByTestId("click-contracts::types::SampleNestedStruct-field")
            .getByTestId("input-name"),
          structDataStatusClick: this.page
            .getByTestId("click-contracts::types::SampleNestedStruct-field")
            .getByTestId("click-contracts::types::SampleStruct-field")
            .getByTestId("click-contracts::types::SampleEnum-field"),
          structDataEnumClick3: this.page
            .getByTestId("click-contracts::types::SampleNestedStruct-field")
            .getByTestId("click-contracts::types::SampleStruct-field")
            .getByTestId("radio-contracts::types::SampleEnum-2"),
          structDataStatusEnum3: this.page
            .getByTestId("click-contracts::types::SampleNestedStruct-field")
            .getByTestId("click-contracts::types::SampleStruct-field")
            .getByTestId("input-enum3"),
        },
        structStatus: this.page
          .getByTestId("click-contracts::types::SampleEnum-field")
          .nth(2),
        structStatusEnumClick3: this.page
          .getByTestId("radio-contracts::types::SampleEnum-2")
          .nth(2),
        structStatusEnum3: this.page.getByTestId("input-enum3").nth(2),
        sendButton: this.page.getByTestId(
          "btn-set_sample_nested_struct_with_key"
        ),
        readValueInput: this.page.locator(
          'input[name="get_sample_nested_struct_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId(
          "btn-get_sample_nested_struct_with_key"
        ),
        readResultValue: this.page.getByTestId(
          "result-get_sample_nested_struct_with_key"
        ),
      },
      enum: {
        keyInput: this.page.locator(
          'input[name="set_sample_enum_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page
          .locator("div")
          .filter({
            hasText: /^valueSampleEnumenumenum1\(\)enum2u256enum3ByteArray$/,
          })
          .getByTestId("click-contracts::types::SampleEnum-field"),
        valueEnum3Click: this.page
          .locator("div")
          .filter({
            hasText: /^valueSampleEnumenumenum1\(\)enum2u256enum3ByteArray$/,
          })
          .getByTestId("radio-contracts::types::SampleEnum-2"),
        valueEnum3Input: this.page
          .locator("div")
          .filter({
            hasText: /^valueSampleEnumenumenum1\(\)enum2u256enum3ByteArray$/,
          })
          .getByTestId("input-enum3"),
        sendButton: this.page.getByTestId("btn-set_sample_enum_with_key"),
        readValueInput: this.page.locator(
          'input[name="get_sample_enum_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_sample_enum_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_sample_enum_with_key"
        ),
      },
      structFiveElement: {
        keyInput: this.page.locator(
          'input[name="set_struct_with_five_elements_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByTestId(
          "click-contracts::types::StructWithFiveElements-field"
        ),
        value: {
          element1: this.page
            .getByTestId("click-contracts::types::StructWithFiveElements-field")
            .getByPlaceholder("u256 element1"),
          element2: this.page
            .getByTestId("click-contracts::types::StructWithFiveElements-field")
            .getByTestId("input-element2"),
          element3: this.page
            .getByTestId("click-contracts::types::StructWithFiveElements-field")
            .getByTestId("input-element3"),
          element4: this.page
            .getByTestId("click-contracts::types::StructWithFiveElements-field")
            .getByTestId("input-element4"),
          element5: this.page
            .getByTestId("click-contracts::types::StructWithFiveElements-field")
            .getByTestId("input-element5"),
        },
        sendButton: this.page.getByTestId(
          "btn-set_struct_with_five_elements_with_key"
        ),
        readValueInput: this.page.locator(
          'input[name="get_struct_with_five_elements_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId(
          "btn-get_struct_with_five_elements_with_key"
        ),
        readResultValue: this.page.getByTestId(
          "result-get_struct_with_five_elements_with_key"
        ),
      },
      structFourLayer: {
        keyInput: this.page.locator(
          'input[name="set_struct_with_4_layers_with_key_key_core\\:\\:felt252"]'
        ),
        layer4: this.page
          .getByTestId("click-contracts::types::StructWith4Layers-field")
          .first(),
        layer3: this.page
          .getByTestId("click-contracts::types::Layer3-field")
          .first(),
        layer2: this.page
          .getByTestId("click-contracts::types::Layer2-field")
          .first(),
        layer1: this.page
          .getByTestId("click-contracts::types::Layer1-field")
          .first(),
        sendValueInput: this.page.getByRole("textbox", {
          name: "u256 layer1_element",
        }),
        sendButton: this.page.getByTestId(
          "btn-set_struct_with_4_layers_with_key"
        ),
        readButton: this.page.getByTestId(
          "btn-get_struct_with_4_layers_with_key"
        ),
        readValueInput: this.page.locator(
          'input[name="get_struct_with_4_layers_with_key_key_core\\:\\:felt252"]'
        ),
        readResultValue: this.page.getByTestId(
          "result-get_struct_with_4_layers_with_key"
        ),
      },
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToStructsTab() {
    const isVisible = await this.structsTab.isVisible().catch(() => false);
    if (!isVisible) {
      throw new Error("Structs tab not found or not visible");
    }
    await this.safeClick(this.structsTab, "Structs tab");
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

      if (toastVisible) return { success: true };

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
   * Sets and sends a sample struct with the given key and value
   * @param key The key identifier for the struct
   * @param value The struct data to set
   */
  async setAndSendSampleStruct(
    key: string,
    value: { structId: string; name: string; enum: { enum3: string } }
  ) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.struct;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `Sample struct key (${key})`);
      await this.safeClick(config.valueInput, "Sample struct value dropdown");

      await this.safeFill(config.structId, value.structId, "Sample struct ID");
      await this.safeFill(config.structName, value.name, "Sample struct name");
      await this.safeClick(
        config.structStatus,
        "Sample struct status dropdown"
      );
      await this.safeClick(
        config.structStatusClick3,
        "Sample struct status enum dropdown"
      );
      await this.safeFill(
        config.structStatusEnum3,
        value.enum.enum3,
        "Sample struct enum3"
      );
      await this.safeClick(config.sendButton, "Send sample struct button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendSampleStruct with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads a sample struct value by key
   * @param key The key to look up
   * @returns Promise with the struct value as string
   */
  async readSampleStruct(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.struct;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Sample struct read key (${key})`
      );
      await this.safeClick(config.readButton, "Read sample struct button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Sample struct result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readSampleStruct with key=${key}`);
      throw error;
    }
  }

  /**
   * Sets and sends a nested struct with the given key and complex value
   * @param key The key identifier for the nested struct
   * @param value The nested struct data to set
   */
  async setAndSendNestedStruct(
    key: string,
    value: {
      structUserContractAddress: string;
      structDataValue: {
        structDataId: string;
        structDataName: string;
        structDataStatus: { enum3: string };
      };
      structDataStatus: { enum3: string };
    }
  ) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.nestedStruct;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `Nested struct key (${key})`);
      await this.safeClick(config.valueInput, "Nested struct value dropdown");

      await this.safeFill(
        config.structContractAddressUser,
        value.structUserContractAddress,
        "Nested struct contract address"
      );
      await this.safeClick(config.structData, "Nested struct data dropdown");


      const dataValue = config.structDataValue;
      await this.safeFill(
        dataValue.structDataId,
        value.structDataValue.structDataId,
        "Nested struct data ID"
      );
      await this.safeFill(
        dataValue.structDataName,
        value.structDataValue.structDataName,
        "Nested struct data name"
      );
      await this.safeClick(
        dataValue.structDataStatusClick,
        "Nested struct data status dropdown"
      );
      await this.safeClick(
        dataValue.structDataEnumClick3,
        "Nested struct data status enum checkbox"
      );
      await this.safeFill(
        dataValue.structDataStatusEnum3,
        value.structDataValue.structDataStatus.enum3,
        "Nested struct data enum3"
      );
      await this.safeClick(
        config.structStatus,
        "Nested struct status dropdown"
      );
      await this.safeClick(
        config.structStatusEnumClick3,
        "Nested struct data status enum checkbox"
      );
      await this.safeFill(
        config.structStatusEnum3,
        value.structDataStatus.enum3,
        "Nested struct enum3"
      );
      await this.safeClick(config.sendButton, "Send nested struct button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendNestedStruct with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads a nested struct value by key
   * @param key The key to look up
   * @returns Promise with the nested struct value as string
   */
  async readNestedStruct(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.nestedStruct;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Nested struct read key (${key})`
      );
      await this.safeClick(config.readButton, "Read nested struct button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Nested struct result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readNestedStruct with key=${key}`);
      throw error;
    }
  }

  /**
   * Sets and sends an enum value with the given key
   * @param key The key identifier for the enum
   * @param value The enum value to set
   */
  async setAndSendSampleEnum(key: string, value: { enum3: string }) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.enum;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `Sample enum key (${key})`);
      await this.safeClick(config.valueInput, "Sample enum value dropdown");
      await this.safeClick(config.valueEnum3Click, "Sample enum3 checkbox");
      await this.safeFill(
        config.valueEnum3Input,
        value.enum3,
        "Sample enum enum3"
      );
      await this.safeClick(config.sendButton, "Send sample enum button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendSampleEnum with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads an enum value by key
   * @param key The key to look up
   * @returns Promise with the enum value as string
   */
  async readSampleEnum(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.enum;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Sample enum read key (${key})`
      );
      await this.safeClick(config.readButton, "Read sample enum button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Sample enum result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readSampleEnum with key=${key}`);
      throw error;
    }
  }

  /**
   * Sets and sends a struct with five different element types
   * @param key The key identifier for the struct
   * @param value Object containing the five elements with different types
   */
  async setAndSendStructFiveElement(
    key: string,
    value: {
      element1: string;
      element2: string;
      element3: string;
      element4: string;
      element5: "true" | "false";
    }
  ) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structFiveElement;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(
        config.keyInput,
        key,
        `Five element struct key (${key})`
      );
      await this.safeClick(
        config.valueInput,
        "Five element struct value dropdown"
      );

      const valueConfig = config.value;
      await this.safeFill(
        valueConfig.element1,
        value.element1,
        "Five element struct element1"
      );
      await this.safeFill(
        valueConfig.element2,
        value.element2,
        "Five element struct element2"
      );
      await this.safeFill(
        valueConfig.element3,
        value.element3,
        "Five element struct element3"
      );
      await this.safeFill(
        valueConfig.element4,
        value.element4,
        "Five element struct element4"
      );
      await this.safeFill(
        valueConfig.element5,
        value.element5,
        "Five element struct element5"
      );
      await this.safeClick(
        config.sendButton,
        "Send five element struct button"
      );
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendStructFiveElement with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads a five-element struct value by key
   * @param key The key to look up
   * @returns Promise with the struct value as string
   */
  async readStructFiveElement(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structFiveElement;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Five element struct read key (${key})`
      );
      await this.safeClick(
        config.readButton,
        "Read five element struct button"
      );

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Five element struct result"
      );
      return resultText;
    } catch (error) {
      await captureError(
        this.page,
        error,
        `readStructFiveElement with key=${key}`
      );
      throw error;
    }
  }

  /**
   * Sets and sends a deeply nested struct with four layers
   * @param key The key identifier for the struct
   * @param value The value to set at the innermost layer
   */
  async setAndSendStructFourLayer(key: string, value: string) {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structFourLayer;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(
        config.keyInput,
        key,
        `Four layer struct key (${key})`
      );
      await this.safeClick(config.layer4, "Four layer struct layer4 dropdown");
      await this.safeClick(config.layer3, "Four layer struct layer3 dropdown");
      await this.safeClick(config.layer2, "Four layer struct layer2 dropdown");
      await this.safeClick(config.layer1, "Four layer struct layer1 dropdown");
      await this.safeFill(
        config.sendValueInput,
        value,
        "Four layer struct value"
      );
      await this.safeClick(config.sendButton, "Send four layer struct button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendStructFourLayer with key=${key}, value=${value}`
      );
      throw error;
    }
  }

  /**
   * Reads a four-layer struct value by key
   * @param key The key to look up
   * @returns Promise with the struct value as string
   */
  async readStructFourLayer(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structFourLayer;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Four layer struct read key (${key})`
      );
      await this.safeClick(config.readButton, "Read four layer struct button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Four layer struct result"
      );
      return resultText;
    } catch (error) {
      await captureError(
        this.page,
        error,
        `readStructFourLayer with key=${key}`
      );
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a sample struct
   * @param key The key identifier for the struct
   * @param value The struct data to test
   * @returns TestResult with success status and relevant information
   */
  async testSampleStruct(
    key: string,
    value: { structId: string; name: string; enum: { enum3: string } }
  ): Promise<TestResult> {
    try {
      await this.setAndSendSampleStruct(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "SampleStruct",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readSampleStruct(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read SampleStruct value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "SampleStruct",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "SampleStruct",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(this.page, error, `SampleStruct test with key ${key}`);

      return {
        success: false,
        actualValue: "",
        error: `SampleStruct test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "SampleStruct",
      };
    }
  }

  /**
   * Complete test for setting and reading a nested struct
   * @param key The key identifier for the struct
   * @param value The nested struct data to test
   * @returns TestResult with success status and relevant information
   */
  async testNestedStruct(
    key: string,
    value: {
      structUserContractAddress: string;
      structDataValue: {
        structDataId: string;
        structDataName: string;
        structDataStatus: { enum3: string };
      };
      structDataStatus: { enum3: string };
    }
  ): Promise<TestResult> {
    try {
      await this.setAndSendNestedStruct(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "NestedStruct",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readNestedStruct(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read NestedStruct value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "NestedStruct",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "NestedStruct",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(this.page, error, `NestedStruct test with key ${key}`);

      return {
        success: false,
        actualValue: "",
        error: `NestedStruct test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "NestedStruct",
      };
    }
  }

  /**
   * Complete test for setting and reading an enum
   * @param key The key identifier for the enum
   * @param value The enum value to test
   * @returns TestResult with success status and relevant information
   */
  async testSampleEnum(
    key: string,
    value: { enum3: string }
  ): Promise<TestResult> {
    try {
      await this.setAndSendSampleEnum(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "SampleEnum",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readSampleEnum(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read SampleEnum value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "SampleEnum",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "SampleEnum",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(this.page, error, `SampleEnum test with key ${key}`);

      return {
        success: false,
        actualValue: "",
        error: `SampleEnum test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "SampleEnum",
      };
    }
  }

  /**
   * Complete test for setting and reading a struct with five different element types
   * @param key The key identifier for the struct
   * @param value Object containing the five elements with different types
   * @returns TestResult with success status and relevant information
   */
  async testStructFiveElement(
    key: string,
    value: {
      element1: string;
      element2: string;
      element3: string;
      element4: string;
      element5: "true" | "false";
    }
  ): Promise<TestResult> {
    try {
      await this.setAndSendStructFiveElement(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "StructFiveElement",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readStructFiveElement(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read StructFiveElement value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "StructFiveElement",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "StructFiveElement",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(
        this.page,
        error,
        `StructFiveElement test with key ${key}`
      );

      return {
        success: false,
        actualValue: "",
        error: `StructFiveElement test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "StructFiveElement",
      };
    }
  }

  /**
   * Complete test for setting and reading a four-layer nested struct
   * @param key The key identifier for the struct
   * @param value The value to set at the innermost layer
   * @returns TestResult with success status and relevant information
   */
  async testStructFourLayer(key: string, value: string): Promise<TestResult> {
    try {
      await this.setAndSendStructFourLayer(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "StructFourLayer",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readStructFourLayer(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read StructFourLayer value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "StructFourLayer",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "StructFourLayer",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(
        this.page,
        error,
        `StructFourLayer test with key ${key}`
      );

      return {
        success: false,
        actualValue: "",
        error: `StructFourLayer test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "StructFourLayer",
      };
    }
  }
}
