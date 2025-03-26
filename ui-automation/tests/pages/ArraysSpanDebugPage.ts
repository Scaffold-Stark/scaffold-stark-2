import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";

type TestResult = { success: boolean; actualValue: string };

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
    await this.arraysSpanTab.click();
  }

  async switchToReadTab() {
    await this.readTab.click();
  }

  async switchToWriteTab() {
    await this.writeTab.click();
  }

  async testGetArrayFelt252(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayFelt252;
    await config.clickField.click();

    await config.addButton.click();
    await config.arrayInputs[0].fill("1");

    await config.addButton.click();
    await config.arrayInputs[1].fill("2");

    await config.readButton.click();
    await this.page.waitForTimeout(1000);
    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetArrayContractAddress(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayContractAddress;
    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();

    await config.addButton.click();
    await config.arrayInputs[0].fill(
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
    );

    await config.readButton.click();
    await this.page.waitForTimeout(1000);
    await config.clickField.click();
    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetArrayStruct(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayStruct;
    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();
    await config.addButton.click();
    await config.structClick.click();

    await config.structId.fill("1"),
      await config.structName.fill("Test Pending"),
      await config.structEnumClick.click();
    await config.structEnum1.fill("1");
    await config.readButton.click();
    await this.page.waitForTimeout(1000);
    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetArrayNestedStruct(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayNestedStruct;
    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();
    await config.addButton.click();
    await config.structClick.click();

    await config.strucAddress.fill(
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
    );
    await config.structDataClick.click();
    await config.structDataId.fill("1");
    await config.structDataName.fill("Starknet Test");

    await config.structDataEnumClick.click();
    await config.strucDataEnum1.fill("1");

    await config.structStatusClick.click();
    await config.structStatusEnum1.fill("2");

    await config.readButton.click();
    await this.page.waitForTimeout(1000);
    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetArrayStructFiveElement(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayStructFiveElement;
    const structData = {
      element1: "256",
      element2: "252",
      element3: "Starknet Test",
      element4:
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      element5: "true",
    };

    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();
    await config.addButton.click();

    await config.structClick.click();
    await this.page.waitForTimeout(300);

    for (let i = 0; i < config.structElement.length; i++) {
      const element = config.structElement[i];
      const value = Object.values(structData)[i];

      await this.scrollToElement(element as Locator);
      await element.clear();
      await element.fill(value);
      await this.page.waitForTimeout(100);
    }

    await this.scrollToElement(config.readButton as Locator);
    await config.readButton.click();
    await this.page.waitForTimeout(1000);

    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }
  async testGetArrayStructFourLayer(): Promise<TestResult> {
    const config = this.inputConfigs.getArrayStrucFourLayer;

    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();
    await config.addButton.click();

    await config.structClick.click();
    await this.page.waitForTimeout(300);
    await config.layer3.click();
    await this.page.waitForTimeout(300);
    await config.layer2.click();
    await this.page.waitForTimeout(300);
    await config.layer1.click();
    await this.page.waitForTimeout(300);
    await config.layer1_element.fill("256");

    await this.scrollToElement(config.readButton as Locator);
    await config.readButton.click();
    await this.page.waitForTimeout(1000);

    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetSpanFelt252(): Promise<TestResult> {
    const config = this.inputConfigs.getSpanFelt252;

    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();

    await config.addButton.click();
    await config.arrayInputs[0].fill("252");

    await config.addButton.click();
    await config.arrayInputs[1].fill("42");

    await this.scrollToElement(config.readButton as Locator);
    await config.readButton.click();
    await this.page.waitForTimeout(1000);

    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }

  async testGetSpanAddressContract(): Promise<TestResult> {
    const config = this.inputConfigs.getSpanContractAddress;

    await this.scrollToElement(config.clickField as Locator);
    await config.clickField.click();

    await config.addButton.click();
    await config.arrayInputs[0].fill(
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
    );
    await this.scrollToElement(config.readButton as Locator);
    await config.readButton.click();
    await this.page.waitForTimeout(1000);

    const resultText = (await config.resultValue.textContent()) || "";
    return { success: resultText ? true : false, actualValue: resultText };
  }
}
