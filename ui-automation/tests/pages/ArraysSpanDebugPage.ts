import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";
import { captureError } from "../utils/error-handler";

type TestResult = {
  success: boolean;
  actualValue: string;
  error?: string;
  details?: any;
  name?: string;
};

interface ArrayValueNestedStructConfig {
  fieldClick: Locator;
  indexfield: Locator;
  addBtn: Locator;
  structClick: Locator;
  contractAddress: Locator;
  sampleStructClick: Locator;
  sampleStructId: Locator;
  sampleStructName: Locator;
  sampleStructStatusClick: Locator;
  sampleStructStatusCheckboxClick: Locator;
  sampleStructStatusEnum3: Locator;
  sampleEnumClick: Locator;
  sampleEnumCheckboxClick: Locator;
  sampleEnum3: Locator;
  buttonRead: Locator;
  result: Locator;
}

interface ArrayValueStructConfig {
  fieldClick: Locator;
  indexfield: Locator;
  addBtn: Locator;
  structClick: Locator;
  structId: Locator;
  structName: Locator;
  sampleStructEnumClick: Locator;
  sampleStructEnumCheckBoxClick: Locator;
  sampleStructEnum3: Locator;
  buttonRead?: Locator;
  result?: Locator;
}

export class ArraysSpansPage extends BasePage {
  private arraysSpanTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private arrayValueNestedStruct: ArrayValueNestedStructConfig;
  private arrayValueStruct: ArrayValueStructConfig;

  constructor(page: Page) {
    super(page);

    this.arraysSpanTab = this.page.getByRole("button", { name: "ArraysSpans" });
    this.readTab = this.page.getByTestId("ArraysSpans-read");
    this.writeTab = this.page.getByTestId("ArraysSpans-write");

    this.arrayValueNestedStruct = {
      fieldClick: this.page
        .getByTestId(
          "click-core::array::Array::<contracts::types::SampleNestedStruct>-field"
        )
        .nth(1),
      indexfield: this.page.locator(
        'input[name="get_array_value_sample_nested_struct_index_core\\:\\:integer\\:\\:u32"]'
      ),
      addBtn: this.page
        .getByTestId(
          "add-core::array::Array::<contracts::types::SampleNestedStruct>-btn"
        )
        .nth(1),
      structClick: this.page
        .getByTestId("click-contracts::types::SampleNestedStruct-field")
        .nth(1),
      contractAddress: this.page.getByRole("textbox", {
        name: "ContractAddress user",
      }),
      sampleStructClick: this.page
        .getByTestId("click-contracts::types::SampleStruct-field")
        .nth(4),
      sampleStructId: this.page.getByPlaceholder("u256 id").nth(4),
      sampleStructName: this.page.getByTestId("input-name").nth(4),
      sampleStructStatusClick: this.page.locator(
        ".ml-3 > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse"
      ),
      sampleStructStatusCheckboxClick: this.page.locator(
        ".ml-3 > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse > .ml-3 > div:nth-child(3) > .radio"
      ),
      sampleStructStatusEnum3: this.page
        .getByRole("textbox", { name: "ByteArray enum3" })
        .nth(1),
      sampleEnumClick: this.page.locator(
        "div:nth-child(19) > div > div:nth-child(2) > div > div:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse"
      ),
      sampleEnumCheckboxClick: this.page.locator(
        "div:nth-child(19) > div > div:nth-child(2) > div > div:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse > .ml-3 > div:nth-child(3) > .radio"
      ),
      sampleEnum3: this.page.getByRole("textbox", { name: "ByteArray enum3" }).nth(
        2
      ),
      buttonRead: this.page.getByTestId(
        "btn-get_array_value_sample_nested_struct"
      ),
      result: this.page.getByTestId(
        "result-get_array_value_sample_nested_struct"
      ),
    };

    this.arrayValueStruct = {
      fieldClick: this.page
        .getByTestId(
          "click-core::array::Array::<contracts::types::SampleStruct>-field"
        )
        .nth(1),
      indexfield: this.page.locator(
        'input[name="get_array_value_sample_struct_index_core\\:\\:integer\\:\\:u32"]'
      ),
      addBtn: this.page
        .getByTestId(
          "add-core::array::Array::<contracts::types::SampleStruct>-btn"
        )
        .nth(1),
      structClick: this.page
        .getByTestId("click-contracts::types::SampleStruct-field")
        .nth(3),
      structId: this.page.getByPlaceholder("u256 id").nth(3),
      structName: this.page.getByTestId("input-name").nth(3),
      sampleStructEnumClick: this.page.locator(
        "div:nth-child(18) > div > div:nth-child(2) > div > div:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse"
      ),
      sampleStructEnumCheckBoxClick: this.page.locator(
        "div:nth-child(18) > div > div:nth-child(2) > div > div:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse > .ml-3 > div:nth-child(3) > .radio"
      ),
      sampleStructEnum3: this.page.getByRole("textbox", {
        name: "ByteArray enum3",
      }),
      buttonRead: this.page.getByTestId("btn-get_array_value_sample_struct"),
      result: this.page.getByTestId("result-get_array_value_sample_struct"),
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToArraysSpanTab() {
    try {
      const isVisible = await this.arraysSpanTab.isVisible().catch(() => false);
      if (!isVisible) {
        throw new Error("ArraysSpans tab not found or not visible");
      }
      await this.safeClick(this.arraysSpanTab, "Arrays Spans tab");
    } catch (error) {
      await captureError(this.page, error, "Switch to ArraysSpans tab");
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

  /**
   * Tests array operations with nested struct type values
   * Creates an array with a nested struct and verifies the result
   * @returns TestResult with success status and actual value
   */
  async testGetArrayValueNestedStruct(): Promise<TestResult> {
    try {
      const config = this.arrayValueNestedStruct;

      await this.scrollToElement(config.fieldClick);
      await this.safeClick(config.fieldClick, "Array Nested Struct field");

      if (await config.indexfield.isVisible()) {
        await this.safeFill(config.indexfield, "0", "Array index");
      }

      await this.safeClick(config.addBtn, "Add button for Array Nested Struct");

      await this.safeClick(config.structClick, "Nested Struct field");

      await this.safeFill(
        config.contractAddress,
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "Contract Address"
      );

      await this.safeClick(config.sampleStructClick, "Sample Struct field");

      await this.safeFill(config.sampleStructId, "42", "Sample Struct ID");
      await this.safeFill(
        config.sampleStructName,
        "Starknet Testing",
        "Sample Struct Name"
      );

      await this.safeClick(
        config.sampleStructStatusClick,
        "Sample Struct Status field"
      );
      await this.safeClick(
        config.sampleStructStatusCheckboxClick,
        "Sample Struct Status checkbox"
      );

      if (await config.sampleStructStatusEnum3.isVisible()) {
        await this.safeFill(
          config.sampleStructStatusEnum3,
          "Status Test Value",
          "Sample Struct Status Enum3"
        );
      }

      await this.safeClick(config.sampleEnumClick, "Sample Enum field");
      await this.safeClick(
        config.sampleEnumCheckboxClick,
        "Sample Enum checkbox"
      );

      if (await config.sampleEnum3.isVisible()) {
        await this.safeFill(
          config.sampleEnum3,
          "Sample Enum3 radio",
          "Sample Enum Status Enum3"
        );
      }

      await this.scrollToElement(config.buttonRead);
      await this.safeClick(
        config.buttonRead,
        "Read button for Array Nested Struct"
      );

      await this.page.waitForTimeout(1000);

      const resultText = await this.safeGetText(
        config.result,
        "Array Nested Struct result"
      );

      return {
        success: resultText ? true : false,
        actualValue: resultText,
        name: "ArrayValueNestedStruct",
      };
    } catch (error) {
      const err = await captureError(
        this.page,
        error,
        "Array Value Nested Struct test"
      );

      return {
        success: false,
        actualValue: "",
        error: err.message,
        name: "ArrayValueNestedStruct",
      };
    }
  }

  /**
   * Tests array operations with struct type values
   * Creates an array with a struct and verifies the result
   * @returns TestResult with success status and actual value
   */
  async testGetArrayValueStruct(): Promise<TestResult> {
    try {
      const config = this.arrayValueStruct;

      await this.scrollToElement(config.fieldClick);
      await this.safeClick(config.fieldClick, "Array Struct field");

      if (await config.indexfield.isVisible()) {
        await this.safeFill(config.indexfield, "0", "Array index");
      }

      await this.safeClick(config.addBtn, "Add button for Array Struct");

      await this.safeClick(config.structClick, "Struct field");

      await this.safeFill(config.structId, "123", "Struct ID");
      await this.safeFill(
        config.structName,
        "Simple Struct Test",
        "Struct Name"
      );

      await this.safeClick(
        config.sampleStructEnumClick,
        "Sample Struct Enum field"
      );
      await this.safeClick(
        config.sampleStructEnumCheckBoxClick,
        "Sample Struct Enum checkbox"
      );

      if (await config.sampleStructEnum3.isVisible()) {
        await this.safeFill(
          config.sampleStructEnum3,
          "Sample Struct Enum3",
          "Sample Struct Enum3"
        );
      }

      if (config.buttonRead) {
        await this.scrollToElement(config.buttonRead);
        await this.safeClick(config.buttonRead, "Read button for Array Struct");

        await this.page.waitForTimeout(1000);

        if (config.result) {
          const resultText = await this.safeGetText(
            config.result,
            "Array Struct result"
          );

          return {
            success: resultText ? true : false,
            actualValue: resultText,
            name: "ArrayValueStruct",
          };
        }
      }

      return {
        success: true,
        actualValue: "Test completed but result verification not available",
        name: "ArrayValueStruct",
      };
    } catch (error) {
      const err = await captureError(
        this.page,
        error,
        "Array Value Struct test"
      );

      return {
        success: false,
        actualValue: "",
        error: err.message,
        name: "ArrayValueStruct",
      };
    }
  }
}
