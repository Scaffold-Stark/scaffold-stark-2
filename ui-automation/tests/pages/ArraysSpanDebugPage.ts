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

interface ArrayFieldConfig {
  clickField: Locator;
  addButton: Locator;
  arrayInputs: Locator[];
  readButton: Locator;
  resultValue: Locator;
}

type InputConfigs = {
  getArrayFelt252: ArrayFieldConfig;
  getArrayContractAddress: ArrayFieldConfig;
  getArrayStruct: {
    clickField: Locator;
    addButton: Locator;
    structClick: Locator;
    structId: Locator;
    structName: Locator;
    structEnumClick: Locator;
    structEnum1: Locator;
    readButton: Locator;
    resultValue: Locator;
  };
  getArrayNestedStruct: {
    clickField: Locator;
    addButton: Locator;
    structClick: Locator;
    strucAddress: Locator;
    structDataClick: Locator;
    structDataId: Locator;
    structDataName: Locator;
    structDataEnumClick: Locator;
    strucDataEnum1: Locator;
    structStatusClick: Locator;
    structStatusEnum1: Locator;
    readButton: Locator;
    resultValue: Locator;
  };
  getArrayStructFiveElement: {
    clickField: Locator;
    addButton: Locator;
    structClick: Locator;
    structElement: Locator[];
    readButton: Locator;
    resultValue: Locator;
  };
  getArrayStrucFourLayer: {
    clickField: Locator;
    addButton: Locator;
    structClick: Locator;
    layer3: Locator;
    layer2: Locator;
    layer1: Locator;
    layer1_element: Locator;
    readButton: Locator;
    resultValue: Locator;
  };
  getSpanFelt252: ArrayFieldConfig;
  getSpanContractAddress: ArrayFieldConfig;
};

export class ArraysSpansDebugPage extends BasePage {
  private arraysSpanTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private inputConfigs: InputConfigs;

  constructor(page: Page) {
    super(page);

    this.arraysSpanTab = this.page.getByRole("button", { name: "ArraysSpans" });
    this.readTab = this.page.getByTestId("ArraysSpans-read");
    this.writeTab = this.page.getByTestId("ArraysSpans-write");

    this.inputConfigs = {
      getArrayFelt252: {
        clickField: this.page
          .getByTestId("click-core::array::Array::<core::felt252>-field")
          .first(),
        addButton: this.page.getByRole("button", { name: "+ Add (push)" }),
        arrayInputs: [
          this.page.getByTestId("input-array[0]"),
          this.page.getByTestId("input-array[1]"),
        ],
        readButton: this.page.getByTestId("btn-get_array_felt252"),
        resultValue: this.page.getByTestId("result-get_array_felt252"),
      },
      getArrayContractAddress: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Array::<core::starknet::contract_address::ContractAddress>-field"
          )
          .first(),
        addButton: this.page
          .getByTestId(
            "add-core::array::Array::<core::starknet::contract_address::ContractAddress>-btn"
          )
          .first(),
        arrayInputs: [this.page.getByPlaceholder("ContractAddress array[0]")],
        readButton: this.page.getByTestId("btn-get_array_contract_address"),
        resultValue: this.page.getByTestId("result-get_array_contract_address"),
      },
      getArrayStruct: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Array::<contracts::arrays_spans::SampleStruct>-field"
          )
          .first(),
        addButton: this.page
          .getByTestId(
            "add-core::array::Array::<contracts::arrays_spans::SampleStruct>-btn"
          )
          .first(),
        structClick: this.page.getByTestId(
          "click-contracts::arrays_spans::SampleStruct-field"
        ),
        structId: this.page
          .getByTestId("click-contracts::arrays_spans::SampleStruct-field")
          .getByPlaceholder("u256 id"),
        structName: this.page
          .getByTestId("click-contracts::arrays_spans::SampleStruct-field")
          .getByTestId("input-name"),
        structEnumClick: this.page.getByTestId(
          "click-contracts::arrays_spans::SampleEnum-field"
        ),
        structEnum1: this.page
          .getByTestId("click-contracts::arrays_spans::SampleEnum-field")
          .getByPlaceholder("u256 enum1"),
        readButton: this.page.getByTestId("btn-get_array_sample_struct"),
        resultValue: this.page.getByTestId("result-get_array_sample_struct"),
      },
      getArrayNestedStruct: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Array::<contracts::arrays_spans::SampleNestedStruct>-field"
          )
          .first(),
        addButton: this.page
          .getByTestId(
            "add-core::array::Array::<contracts::arrays_spans::SampleNestedStruct>-btn"
          )
          .first(),
        structClick: this.page.getByTestId(
          "click-contracts::arrays_spans::SampleNestedStruct-field"
        ),
        strucAddress: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByTestId("input-user"),
        structDataClick: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByTestId("click-contracts::arrays_spans::SampleStruct-field"),
        structDataId: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByPlaceholder("u256 id"),
        structDataName: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByTestId("input-name"),
        structDataEnumClick: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByTestId("click-contracts::arrays_spans::SampleStruct-field")
          .getByTestId("click-contracts::arrays_spans::SampleEnum-field"),
        strucDataEnum1: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByTestId("click-contracts::arrays_spans::SampleStruct-field")
          .getByPlaceholder("u256 enum1"),
        structStatusClick: this.page
          .getByTestId("click-contracts::arrays_spans::SampleEnum-field")
          .nth(2),
        structStatusEnum1: this.page
          .getByTestId(
            "click-contracts::arrays_spans::SampleNestedStruct-field"
          )
          .getByPlaceholder("u256 enum1")
          .nth(1),
        readButton: this.page.getByTestId("btn-get_array_sample_nested_struct"),
        resultValue: this.page.getByTestId(
          "result-get_array_sample_nested_struct"
        ),
      },
      getArrayStructFiveElement: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Array::<contracts::arrays_spans::StructWithFiveElements>-field"
          )
          .first(),
        addButton: this.page
          .getByTestId(
            "add-core::array::Array::<contracts::arrays_spans::StructWithFiveElements>-btn"
          )
          .first(),
        structClick: this.page.getByTestId(
          "click-contracts::arrays_spans::StructWithFiveElements-field"
        ),
        structElement: [
          this.page
            .getByTestId(
              "click-contracts::arrays_spans::StructWithFiveElements-field"
            )
            .getByPlaceholder("u256 element1"),
          this.page
            .getByTestId(
              "click-contracts::arrays_spans::StructWithFiveElements-field"
            )
            .getByTestId("input-element2"),
          this.page
            .getByTestId(
              "click-contracts::arrays_spans::StructWithFiveElements-field"
            )
            .getByTestId("input-element3"),
          this.page
            .getByTestId(
              "click-contracts::arrays_spans::StructWithFiveElements-field"
            )
            .getByTestId("input-element4"),
          this.page
            .getByTestId(
              "click-contracts::arrays_spans::StructWithFiveElements-field"
            )
            .getByTestId("input-element5"),
        ],
        readButton: this.page.getByTestId(
          "btn-get_array_struct_with_five_elements"
        ),
        resultValue: this.page.getByTestId(
          "result-get_array_struct_with_five_elements"
        ),
      },
      getArrayStrucFourLayer: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Array::<contracts::arrays_spans::StructWith4Layers>-field"
          )
          .first(),
        structClick: this.page.getByTestId(
          "click-contracts::arrays_spans::StructWith4Layers-field"
        ),
        layer3: this.page.getByTestId(
          "click-contracts::arrays_spans::Layer3-field"
        ),
        layer2: this.page.getByTestId(
          "click-contracts::arrays_spans::Layer2-field"
        ),
        layer1: this.page.getByTestId(
          "click-contracts::arrays_spans::Layer1-field"
        ),
        layer1_element: this.page
          .getByTestId("click-contracts::arrays_spans::Layer1-field")
          .getByPlaceholder("u256 layer1_element"),
        addButton: this.page
          .getByTestId(
            "add-core::array::Array::<contracts::arrays_spans::StructWith4Layers>-btn"
          )
          .first(),
        readButton: this.page.getByTestId("btn-get_array_struct_with_4_layers"),
        resultValue: this.page.getByTestId(
          "result-get_array_struct_with_4_layers"
        ),
      },
      getSpanFelt252: {
        clickField: this.page
          .getByTestId("click-core::array::Span::<core::felt252>-field")
          .first(),
        addButton: this.page
          .getByTestId("add-core::array::Span::<core::felt252>-btn")
          .first(),
        arrayInputs: [
          this.page.getByPlaceholder("felt252 span[0]"),
          this.page.getByTestId("input-span[1]"),
        ],
        readButton: this.page.getByTestId("btn-get_span_felt252"),
        resultValue: this.page.getByTestId("result-get_span_felt252"),
      },
      getSpanContractAddress: {
        clickField: this.page
          .getByTestId(
            "click-core::array::Span::<core::starknet::contract_address::ContractAddress>-field"
          )
          .first(),
        addButton: this.page
          .getByTestId(
            "add-core::array::Span::<core::starknet::contract_address::ContractAddress>-btn"
          )
          .first(),
        arrayInputs: [this.page.getByPlaceholder("ContractAddress span[0]")],
        readButton: this.page.getByTestId("btn-get_span_contract_address"),
        resultValue: this.page.getByTestId("result-get_span_contract_address"),
      },
    };
  }

  private async scrollToElement(element: Locator) {
    await element.scrollIntoViewIfNeeded();
  }

  async switchToArraysSpanTab() {
    try {
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

  async testGetArrayFelt252(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayFelt252;
      
      await this.safeClick(config.clickField, "Array Felt252 field");
      await this.safeClick(config.addButton, "Add button for Array Felt252");
      await this.safeFill(config.arrayInputs[0], "1", "Array Felt252 first element");
      
      await this.safeClick(config.addButton, "Add button for Array Felt252 second element");
      await this.safeFill(config.arrayInputs[1], "2", "Array Felt252 second element");
      
      await this.safeClick(config.readButton, "Read button for Array Felt252");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Array Felt252 result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayFelt252"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Felt252 test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayFelt252"
      };
    }
  }

  async testGetArrayContractAddress(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayContractAddress;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Array Contract Address field");
      
      await this.safeClick(config.addButton, "Add button for Array Contract Address");
      await this.safeFill(
        config.arrayInputs[0], 
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691", 
        "Array Contract Address element"
      );
      
      await this.safeClick(config.readButton, "Read button for Array Contract Address");
      await this.page.waitForTimeout(1000);
      
      await this.safeClick(config.clickField, "Array Contract Address field to refresh");
      const resultText = await this.safeGetText(config.resultValue, "Array Contract Address result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayContractAddress"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Contract Address test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayContractAddress"
      };
    }
  }

  async testGetArrayStruct(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayStruct;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Array Struct field");
      await this.safeClick(config.addButton, "Add button for Array Struct");
      await this.safeClick(config.structClick, "Struct field");

      await this.safeFill(config.structId, "1", "Struct ID");
      await this.safeFill(config.structName, "Test Pending", "Struct Name");
      await this.safeClick(config.structEnumClick, "Struct Enum field");
      await this.safeFill(config.structEnum1, "1", "Struct Enum1 value");
      
      await this.safeClick(config.readButton, "Read button for Array Struct");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Array Struct result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayStruct"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Struct test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayStruct"
      };
    }
  }

  async testGetArrayNestedStruct(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayNestedStruct;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Array Nested Struct field");
      await this.safeClick(config.addButton, "Add button for Array Nested Struct");
      await this.safeClick(config.structClick, "Nested Struct field");

      await this.safeFill(
        config.strucAddress,
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        "Struct Contract Address"
      );
      await this.safeClick(config.structDataClick, "Struct Data field");
      await this.safeFill(config.structDataId, "1", "Struct Data ID");
      await this.safeFill(config.structDataName, "Starknet Test", "Struct Data Name");

      await this.safeClick(config.structDataEnumClick, "Struct Data Enum field");
      await this.safeFill(config.strucDataEnum1, "1", "Struct Data Enum1");

      await this.safeClick(config.structStatusClick, "Struct Status field");
      await this.safeFill(config.structStatusEnum1, "2", "Struct Status Enum1");

      await this.safeClick(config.readButton, "Read button for Array Nested Struct");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Array Nested Struct result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayNestedStruct"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Nested Struct test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayNestedStruct"
      };
    }
  }

  async testGetArrayStructFiveElement(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayStructFiveElement;
      const structData = {
        element1: "256",
        element2: "252",
        element3: "Starknet Test",
        element4: "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        element5: "true",
      };
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Array Struct Five Element field");
      await this.safeClick(config.addButton, "Add button for Array Struct Five Element");
      await this.safeClick(config.structClick, "Struct Five Element field");
      
      await this.page.waitForTimeout(300);
      
      for (let i = 0; i < config.structElement.length; i++) {
        const element = config.structElement[i];
        const value = Object.values(structData)[i];
        
        await this.scrollToElement(element);
        await element.clear();
        await this.safeFill(element, value, `Struct Five Element ${i+1}`);
        await this.page.waitForTimeout(100);
      }
      
      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "Read button for Array Struct Five Element");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Array Struct Five Element result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayStructFiveElement"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Struct Five Element test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayStructFiveElement"
      };
    }
  }

  async testGetArrayStructFourLayer(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getArrayStrucFourLayer;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Array Struct Four Layer field");
      await this.safeClick(config.addButton, "Add button for Array Struct Four Layer");
      await this.safeClick(config.structClick, "Struct Four Layer field");
      
      await this.page.waitForTimeout(300);
      await this.safeClick(config.layer3, "Layer 3 field");
      await this.page.waitForTimeout(300);
      await this.safeClick(config.layer2, "Layer 2 field");
      await this.page.waitForTimeout(300);
      await this.safeClick(config.layer1, "Layer 1 field");
      await this.page.waitForTimeout(300);
      await this.safeFill(config.layer1_element, "256", "Layer 1 element value");
      
      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "Read button for Array Struct Four Layer");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Array Struct Four Layer result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "ArrayStructFourLayer"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Array Struct Four Layer test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "ArrayStructFourLayer"
      };
    }
  }

  async testGetSpanFelt252(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getSpanFelt252;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Span Felt252 field");
      
      await this.safeClick(config.addButton, "Add button for Span Felt252");
      await this.safeFill(config.arrayInputs[0], "252", "Span Felt252 first element");
      
      await this.safeClick(config.addButton, "Add button for Span Felt252 second element");
      await this.safeFill(config.arrayInputs[1], "42", "Span Felt252 second element");
      
      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "Read button for Span Felt252");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Span Felt252 result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "SpanFelt252"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Span Felt252 test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "SpanFelt252"
      };
    }
  }

  async testGetSpanAddressContract(): Promise<TestResult> {
    try {
      const config = this.inputConfigs.getSpanContractAddress;
      
      await this.scrollToElement(config.clickField);
      await this.safeClick(config.clickField, "Span Contract Address field");
      
      await this.safeClick(config.addButton, "Add button for Span Contract Address");
      await this.safeFill(
        config.arrayInputs[0], 
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691", 
        "Span Contract Address element"
      );
      
      await this.scrollToElement(config.readButton);
      await this.safeClick(config.readButton, "Read button for Span Contract Address");
      await this.page.waitForTimeout(1000);
      
      const resultText = await this.safeGetText(config.resultValue, "Span Contract Address result");
      
      return { 
        success: resultText ? true : false, 
        actualValue: resultText,
        name: "SpanContractAddress"
      };
    } catch (error) {
      const err = await captureError(this.page, error, "Span Contract Address test");
      
      return { 
        success: false, 
        actualValue: "", 
        error: err.message,
        name: "SpanContractAddress"
      };
    }
  }
}