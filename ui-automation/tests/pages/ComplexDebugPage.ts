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

interface StructWithTupleValue {
  tupleElement: string;
  contractAddress: string;
}

interface SampleEnum {
  enum1: string;
  enum2: string;
  enum3: string;
}

interface SampleStruct {
  id: string;
  name: string;
  enum: SampleEnum;
}

interface ComplexStructValue {
  id: string;
  sampleStruct: SampleStruct;
  status: string;
  layer1Element: string;
  tupleData: string;
}

interface TransactionStatus {
  success: boolean;
  error?: string;
}

interface ArrayFieldConfig {
  clickField: Locator;
  addButton: Locator;
  valueInput: Locator;
  readButton: Locator;
  resultValue: Locator;
}

interface StructWithTupleConfig {
  keyInput: Locator;
  valueInput: Locator;
  tupleElement: Locator;
  contractAddress: Locator;
  sendButton: Locator;
  readValueInput: Locator;
  readButton: Locator;
  readResultValue: Locator;
}

interface ComplexStructConfig {
  keyInput: Locator;
  valueInput: Locator;
  idValue: Locator;
  sampleStructClick: Locator;
  sampleStructOptionClick: Locator;
  sampleStructOptionId: Locator;
  sampleStructOptionName: Locator;
  sampleStructOptionEnumClick: Locator;
  sampleStructOptionEnum1Fill: Locator;
  sampleStructOptionEnum2Click: Locator;
  sampleStructOptionEnum2Fill: Locator;
  sampleStructOptionEnum3Click: Locator;
  sampleStructOptionEnum3Fill: Locator;
  statusClick: Locator;
  statusFill: Locator;
  structLayer4Click: Locator;
  structLayer3Click: Locator;
  structLayer2Click: Locator;
  structLayer1Fill: Locator;
  tupleData: Locator;
  sendButton: Locator;
  readValueInput: Locator;
  readButton: Locator;
  readResultValue: Locator;
}

interface InputConfigs {
  structWithTuple: StructWithTupleConfig;
  complexWithStruct: ComplexStructConfig;
}

export class ComplexDebugPage extends BasePage {
  private complexTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private transaction_completed: Locator;
  private inputConfigs: InputConfigs;

  constructor(page: Page) {
    super(page);
    this.complexTab = this.page.getByRole("button", { name: "Complex" });
    this.readTab = this.page.getByTestId("Complex-read");
    this.writeTab = this.page.getByTestId("Complex-write");
    this.transaction_completed = this.page.getByText("🎉Transaction completed");

    this.inputConfigs = {
      structWithTuple: {
        keyInput: this.page.locator(
          'input[name="set_struct_with_tuple_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByTestId(
          "click-contracts::complex::StructWithTuple-field"
        ),
        tupleElement: this.page.getByTestId("input-tuple_element"),
        contractAddress: this.page
          .getByTestId("click-contracts::complex::StructWithTuple-field")
          .getByTestId("input-element2"),
        sendButton: this.page.getByTestId("btn-set_struct_with_tuple_with_key"),

        readValueInput: this.page.locator(
          'input[name="get_struct_with_tuple_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_struct_with_tuple_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_struct_with_tuple_with_key"
        ),
      },
      complexWithStruct: {
        keyInput: this.page.locator(
          'input[name="set_complex_struct_with_key_key_core\\:\\:felt252"]'
        ),
        valueInput: this.page.getByTestId(
          "click-contracts::complex::ComplexStruct-field"
        ),
        idValue: this.page.getByPlaceholder("u256 u256_id"),
        sampleStructClick: this.page.getByTestId(
          "click-core::option::Option::<contracts::types::SampleStruct>-field"
        ),
        sampleStructOptionClick: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("click-contracts::types::SampleStruct-field"),
        sampleStructOptionId: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByPlaceholder("u256 id"),
        sampleStructOptionName: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("input-name"),
        sampleStructOptionEnumClick: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("click-contracts::types::SampleEnum-field"),
        sampleStructOptionEnum1Fill: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("input-enum1"),
        sampleStructOptionEnum2Click: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("click-contracts::types::SampleEnum-field")
          .locator('input[name="radio-1"]'),
        sampleStructOptionEnum2Fill: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByPlaceholder("u256 enum2"),
        sampleStructOptionEnum3Click: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .locator('input[name="radio-2"]'),
        sampleStructOptionEnum3Fill: this.page
          .getByTestId(
            "click-core::option::Option::<contracts::types::SampleStruct>-field"
          )
          .getByTestId("input-enum3"),
        statusClick: this.page.getByTestId(
          "click-core::result::Result::<core::bool, core::integer::u64>-field"
        ),
        statusFill: this.page.getByTestId("input-Ok"),
        structLayer4Click: this.page
          .getByTestId("click-contracts::complex::ComplexStruct-field")
          .getByTestId("click-contracts::types::StructWith4Layers-field"),
        structLayer3Click: this.page
          .getByTestId("click-contracts::complex::ComplexStruct-field")
          .getByTestId("click-contracts::types::Layer2-field"),
        structLayer2Click: this.page
          .getByTestId("click-contracts::complex::ComplexStruct-field")
          .getByTestId("click-contracts::types::Layer1-field"),
        structLayer1Fill: this.page
          .getByTestId("click-contracts::complex::ComplexStruct-field")
          .getByPlaceholder("u256 layer1_element"),
        tupleData: this.page.getByTestId("input-tuple_data"),
        sendButton: this.page.getByTestId("btn-set_complex_struct_with_key"),

        readValueInput: this.page.locator(
          'input[name="get_complex_struct_with_key_key_core\\:\\:felt252"]'
        ),
        readButton: this.page.getByTestId("btn-get_complex_struct_with_key"),
        readResultValue: this.page.getByTestId(
          "result-get_complex_struct_with_key"
        ),
      },
    };
  }

  private async scrollToElement(element: Locator): Promise<void> {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToVarsTab(): Promise<void> {
    const isVisible = await this.complexTab.isVisible().catch(() => false);
    if (!isVisible) {
      throw new Error("Complex tab not found or not visible");
    }
    await this.safeClick(this.complexTab, "Complex tab");
  }

  async switchToReadTab(): Promise<void> {
    await this.safeClick(this.readTab, "Read tab");
  }

  async switchToWriteTab(): Promise<void> {
    await this.safeClick(this.writeTab, "Write tab");
  }

  /**
   * Checks if a transaction completed successfully
   * @returns Object with success status and optional error message
   */
  async isTransactionCompleted(): Promise<TransactionStatus> {
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
   * Sets and sends a struct with tuple value with the given key and value
   * @param key The key identifier for the struct with tuple
   * @param value The struct with tuple data to set
   */
  async setAndSendStructWithTuple(
    key: string,
    value: StructWithTupleValue
  ): Promise<void> {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structWithTuple;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(
        config.keyInput,
        key,
        `Struct with tuple key (${key})`
      );
      await this.safeClick(
        config.valueInput,
        "Struct with tuple value dropdown"
      );

      await this.safeFill(
        config.tupleElement,
        value.tupleElement,
        "Struct with tuple tuple_element"
      );
      await this.safeFill(
        config.contractAddress,
        value.contractAddress,
        "Struct with tuple contract address"
      );
      await this.safeClick(config.sendButton, "Send struct with tuple button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendStructWithTuple with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads a struct with tuple value by key
   * @param key The key to look up
   * @returns Promise with the struct with tuple value as string
   */
  async readStructWithTuple(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.structWithTuple;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Struct with tuple read key (${key})`
      );
      await this.safeClick(config.readButton, "Read struct with tuple button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Struct with tuple result"
      );
      return resultText;
    } catch (error) {
      await captureError(
        this.page,
        error,
        `readStructWithTuple with key=${key}`
      );
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a struct with tuple
   * @param key The key identifier for the struct with tuple
   * @param value The struct with tuple data to test
   * @returns TestResult with success status and relevant information
   */
  async testStructWithTuple(
    key: string,
    value: StructWithTupleValue
  ): Promise<TestResult> {
    try {
      await this.setAndSendStructWithTuple(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "StructWithTuple",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readStructWithTuple(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read StructWithTuple value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "StructWithTuple",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "StructWithTuple",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(
        this.page,
        error,
        `StructWithTuple test with key ${key}`
      );

      return {
        success: false,
        actualValue: "",
        error: `StructWithTuple test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "StructWithTuple",
      };
    }
  }

  /**
   * Sets and sends a complex struct with the given key and values
   * @param key The key identifier for the complex struct
   * @param value The complex struct data to set
   */
  async setAndSendComplexStruct(
    key: string,
    value: ComplexStructValue
  ): Promise<void> {
    try {
      await this.switchToWriteTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.complexWithStruct;
      await this.scrollToElement(config.keyInput);
      await this.safeFill(config.keyInput, key, `Complex struct key (${key})`);
      await this.safeClick(config.valueInput, "Complex struct value dropdown");

      // Fill ID
      await this.safeFill(config.idValue, value.id, "Complex struct ID");

      await this.safeClick(
        config.sampleStructClick,
        "Sample struct option dropdown"
      );
      await this.safeClick(
        config.sampleStructOptionClick,
        "Sample struct field dropdown"
      );
      await this.safeFill(
        config.sampleStructOptionId,
        value.sampleStruct.id,
        "Sample struct ID"
      );
      await this.safeFill(
        config.sampleStructOptionName,
        value.sampleStruct.name,
        "Sample struct name"
      );

      await this.safeClick(
        config.sampleStructOptionEnumClick,
        "Sample struct enum dropdown"
      );

      await this.safeFill(
        config.sampleStructOptionEnum1Fill,
        value.sampleStruct.enum.enum1,
        "Sample struct enum1"
      );

      await this.safeClick(
        config.sampleStructOptionEnum2Click,
        "Sample struct enum2 radio"
      );
      await this.safeFill(
        config.sampleStructOptionEnum2Fill,
        value.sampleStruct.enum.enum2,
        "Sample struct enum2"
      );

      await this.safeClick(
        config.sampleStructOptionEnum3Click,
        "Sample struct enum3 radio"
      );
      await this.safeFill(
        config.sampleStructOptionEnum3Fill,
        value.sampleStruct.enum.enum3,
        "Sample struct enum3"
      );

      await this.safeClick(config.statusClick, "Status result dropdown");
      await this.safeFill(config.statusFill, value.status, "Status value");

      await this.safeClick(config.structLayer4Click, "Struct layer 4 dropdown");
      await this.safeClick(config.structLayer3Click, "Struct layer 3 dropdown");
      await this.safeClick(config.structLayer2Click, "Struct layer 2 dropdown");
      await this.safeFill(
        config.structLayer1Fill,
        value.layer1Element,
        "Layer 1 element"
      );

      await this.safeFill(config.tupleData, value.tupleData, "Tuple data");

      await this.safeClick(config.sendButton, "Send complex struct button");
    } catch (error) {
      await captureError(
        this.page,
        error,
        `setAndSendComplexStruct with key=${key}, value=${JSON.stringify(value)}`
      );
      throw error;
    }
  }

  /**
   * Reads a complex struct value by key
   * @param key The key to look up
   * @returns Promise with the complex struct value as string
   */
  async readComplexStruct(key: string): Promise<string> {
    try {
      await this.switchToReadTab();
      await this.page.waitForTimeout(500);

      const config = this.inputConfigs.complexWithStruct;
      await this.scrollToElement(config.readValueInput);
      await this.safeFill(
        config.readValueInput,
        key,
        `Complex struct read key (${key})`
      );
      await this.safeClick(config.readButton, "Read complex struct button");

      await this.page.waitForTimeout(1000);
      const resultText = await this.safeGetText(
        config.readResultValue,
        "Complex struct result"
      );
      return resultText;
    } catch (error) {
      await captureError(this.page, error, `readComplexStruct with key=${key}`);
      throw error;
    }
  }

  /**
   * Complete test for setting and reading a complex struct
   * @param key The key identifier for the complex struct
   * @param value The complex struct data to test
   * @returns TestResult with success status and relevant information
   */
  async testComplexStruct(
    key: string,
    value: ComplexStructValue
  ): Promise<TestResult> {
    try {
      await this.setAndSendComplexStruct(key, value);
      await this.page.waitForTimeout(3000);

      const transactionResult = await this.isTransactionCompleted();
      if (!transactionResult.success) {
        return {
          success: false,
          actualValue: "",
          error: transactionResult.error || "Transaction failed",
          details: { key, value },
          name: "ComplexStruct",
        };
      }

      let resultText = "";
      try {
        resultText = await this.readComplexStruct(key);
      } catch (readError) {
        const readErrorMsg =
          readError instanceof Error ? readError.message : String(readError);
        return {
          success: false,
          actualValue: "",
          error: `Failed to read ComplexStruct value after setting: ${readErrorMsg}`,
          details: { key, value },
          name: "ComplexStruct",
        };
      }

      return {
        success: !!resultText,
        actualValue: resultText,
        details: { key, value, actualValue: resultText },
        name: "ComplexStruct",
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await captureError(
        this.page,
        error,
        `ComplexStruct test with key ${key}`
      );

      return {
        success: false,
        actualValue: "",
        error: `ComplexStruct test execution failed: ${errorMsg}`,
        details: { key, value },
        name: "ComplexStruct",
      };
    }
  }
}
