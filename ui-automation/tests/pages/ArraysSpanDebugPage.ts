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
//   getArrayContractAddress: ArrayFieldConfig;
//   getArrayStruct: {
//     clickField: Locator;
//     addButton: Locator;
//     structClick: Locator;
//     structId: Locator;
//     structName: Locator;
//     structEnumClick: Locator;
//     structEnum1: Locator;
//     readButton: Locator;
//     resultValue: Locator;
//   };
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
        clickField: this.page.locator(
          "div:nth-child(2) > div > div:nth-child(2) > .collapse"
        ),
        addButton: this.page.getByRole("button", { name: "+ Add (push)" }),
        arrayInputs: [
          this.page.getByTestId("input-array[0]"),
          this.page.getByTestId("input-array[1]"),
        ],
        readButton: this.page.getByTestId("btn-get_array_felt252"),
        resultValue: this.page.getByTestId("result-get_array_felt252"),
      },
    //   getArrayContractAddress: {
    //     clickField: this.page.getByText('array (length: 1)array[0]ContractAddress+ Add (push)- Remove (pop)'),
    //     addButton: this.page
    //       .getByRole("button", { name: "+ Add (push)" })
    //       .nth(1),
    //     arrayInputs: [this.page.getByPlaceholder("ContractAddress array[0]")],
    //     readButton: this.page.getByTestId("btn-get_array_contract_address"),
    //     resultValue: this.page.getByTestId("result-get_array_contract_address"),
    //   },
    //   getArrayStruct: {
    //     clickField: this.page.locator(
    //       "div:nth-child(5) > div > div:nth-child(2) > .collapse"
    //     ),
    //     addButton: this.page
    //       .getByRole("button", { name: "+ Add (push)" })
    //       .nth(2),
    //     structClick: this.page.getByText("structidu256∗").nth(3),
    //     structId: this.page.getByRole("textbox", { name: "u256 id" }),
    //     structName: this.page.getByRole("textbox", { name: "ByteArray name" }),
    //     structEnumClick: this.page.locator(
    //       "div:nth-child(5) > div > div:nth-child(2) > div > div:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(3) > div:nth-child(2) > .collapse"
    //     ),
    //     structEnum1: this.page.getByRole("textbox", { name: "u256 enum1" }),
    //     readButton: this.page.getByTestId("btn-get_array_sample_struct"),
    //     resultValue: this.page.getByTestId("result-get_array_sample_struct"),
    //   },
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
    return { success: true, actualValue: resultText };
  }

//   async testGetArrayContractAddress(): Promise<TestResult> {
//     const config = this.inputConfigs.getArrayContractAddress;
//     await this.scrollToElement(config.clickField as Locator);
//     await config.clickField.click();

//     await config.addButton.click();
//     await config.arrayInputs[0].fill(
//       "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
//     );

//     await config.readButton.click();
//     await this.page.waitForTimeout(1000);

//     const resultText = (await config.resultValue.textContent()) || "";
//     return { success: true, actualValue: resultText };
//   }

//   async testGetArrayStruct(): Promise<TestResult> {
//     const config = this.inputConfigs.getArrayStruct;
//     await this.scrollToElement(config.clickField as Locator);
//     await config.clickField.click();
//     await config.addButton.click();

//     await config.structId.fill("1"),
//       await config.structName.fill("Test Pending"),
//       await config.structEnumClick.click();
//     await config.structEnum1.fill("1");
//     await config.readButton.click();
//     await this.page.waitForTimeout(1000);
//     const resultText = (await config.resultValue.textContent()) || "";
//     return { success: true, actualValue: resultText };
//   }
}
