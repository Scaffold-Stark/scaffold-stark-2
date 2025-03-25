import { Page, Locator } from "playwright";
import { BasePage } from "./BasePage";

type TestResult = { success: boolean; actualValue: string };
type ElementConfig = Record<string, Locator | Record<string, any>>;

export class StructsDebugPage extends BasePage {
  private structsTab: Locator;
  private readTab: Locator;
  private writeTab: Locator;
  private transaction_completed: Locator;
  private inputConfigs: Record<string, ElementConfig>;

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
        valueInput: this.page.getByText("structidu256∗").first(),
        structId: this.page.getByRole("textbox", { name: "u256 id" }),
        structName: this.page.getByRole("textbox", { name: "ByteArray name" }),
        structStatus: this.page.getByText("enumenum1u256∗enum2u256∗").first(),
        structStatusEnum1: this.page.getByRole("textbox", {
          name: "u256 enum1",
        }),
        sendButton: this.page
          .locator(
            "div:nth-child(3) > .col-span-5 > div:nth-child(2) > .z-10 > .rounded-\\[5px\\] > .p-5 > div > div > div:nth-child(4) > .flex > .btn"
          )
          .first(),
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
        valueInput: this.page.getByText(
          "structuserContractAddressdataSampleStructstructidu256∗"
        ),
        structContractAddressUser: this.page.getByTestId("input-user"),
        structData: this.page.getByText("structidu256∗").nth(1),
        structDataValue: {
          structDataId: this.page.getByRole("textbox", { name: "u256 id" }),
          structDataName: this.page.getByRole("textbox", {
            name: "ByteArray name",
          }),
          structDataStatus: this.page
            .getByText("enumenum1u256∗enum2u256∗")
            .nth(1),
          structDataStatusEnum1: this.page.getByRole("textbox", {
            name: "u256 enum1",
          }),
        },
        structStatus: this.page.getByText("enumenum1u256∗enum2u256∗").nth(2),
        structStatusEnum1: this.page.getByPlaceholder("u256 enum1").nth(2),
        sendButton: this.page.locator(
          "div:nth-child(3) > .col-span-5 > div:nth-child(2) > .z-10 > .rounded-\\[5px\\] > .p-5 > div:nth-child(2) > div > div:nth-child(4) > .flex"
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
        valueInput: this.page.getByText("enumenum1u256∗enum2u256∗").nth(3),
        valueEnum1Input: this.page.getByRole("textbox", { name: "u256 enum1" }),
        sendButton: this.page.locator(
          "div:nth-child(3) > .col-span-5 > div:nth-child(2) > .z-10 > .rounded-\\[5px\\] > .p-5 > div:nth-child(3) > div > div:nth-child(4) > .flex"
        ),
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
        valueInput: this.page.getByText("structelement1u256∗").first(),
        value: {
          element1: this.page.getByRole("textbox", { name: "u256 element1" }),
          element2: this.page.getByRole("textbox", {
            name: "felt252 element2",
          }),
          element3: this.page.getByRole("textbox", {
            name: "ByteArray element3",
          }),
          element4: this.page.getByRole("textbox", {
            name: "ContractAddress element4",
          }),
          element5: this.page.getByRole("textbox", { name: "bool element5" }),
        },
        sendButton: this.page.locator(
          "div:nth-child(3) > .col-span-5 > div:nth-child(2) > .z-10 > .rounded-\\[5px\\] > .p-5 > div:nth-child(4) > div > div:nth-child(4) > .flex"
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
          .getByText(
            "structlayer4_elementLayer3structlayer3_elementLayer2structlayer2_elementLayer1st"
          )
          .first(),
        layer3: this.page
          .getByText(
            "structlayer3_elementLayer2structlayer2_elementLayer1structlayer1_elementu256∗"
          )
          .first(),
        layer2: this.page
          .getByText("structlayer2_elementLayer1structlayer1_elementu256∗")
          .first(),
        layer1: this.page.getByText("structlayer1_elementu256∗").first(),
        sendValueInput: this.page.getByRole("textbox", {
          name: "u256 layer1_element",
        }),
        sendButton: this.page.locator(
          "div:nth-child(6) > div > div:nth-child(4) > .flex"
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
    await this.structsTab.click();
  }

  async switchToReadTab() {
    await this.readTab.click();
  }

  async switchToWriteTab() {
    await this.writeTab.click();
  }

  async isTransactionCompleted(): Promise<boolean> {
    try {
      const toastVisible = await this.transaction_completed
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (toastVisible) return true;

      await this.page.waitForTimeout(2000);
      const errorVisible = await this.page
        .getByText(/error|failed|failure/i)
        .isVisible()
        .catch(() => false);
      return !errorVisible;
    } catch {
      return false;
    }
  }

  async setAndSendSampleStruct(
    key: string,
    value: { structId: string; name: string; enum: { enum1: string } }
  ) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.struct;
    await this.scrollToElement(config.keyInput as Locator);

    await (config.keyInput as Locator).fill(key);
    await (config.valueInput as Locator).click();

    await (config.structId as Locator).fill(value.structId);
    await (config.structName as Locator).fill(value.name);
    await (config.structStatus as Locator).click();
    await (config.structStatusEnum1 as Locator).fill(value.enum.enum1);
    await (config.sendButton as Locator).click();
    await this.scrollToElement(config.keyInput as Locator);
  }

  async setAndSendNestedStruct(
    key: string,
    value: {
      structUserContractAddress: string;
      structDataValue: {
        structDataId: string;
        structDataName: string;
        structDataStatus: { enum1: string };
      };
      structDataStatus: { enum1: string };
    }
  ) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.nestedStruct;
    await this.scrollToElement(config.keyInput as Locator);

    await (config.keyInput as Locator).fill(key);
    await (config.valueInput as Locator).click();

    await this.page.waitForTimeout(500);
    await (config.structContractAddressUser as Locator).fill(
      value.structUserContractAddress
    );
    await (config.structData as Locator).click();

    await this.page.waitForTimeout(500);
    const dataValue = config.structDataValue as Record<string, Locator>;
    await (dataValue.structDataId as Locator).fill(
      value.structDataValue.structDataId
    );
    await (dataValue.structDataName as Locator).fill(
      value.structDataValue.structDataName
    );
    await (dataValue.structDataStatus as Locator).click();

    await this.page.waitForTimeout(500);
    await (dataValue.structDataStatusEnum1 as Locator).fill(
      value.structDataValue.structDataStatus.enum1
    );
    await (config.structStatus as Locator).click();

    await this.page.waitForTimeout(500);
    await (config.structStatusEnum1 as Locator).fill(
      value.structDataStatus.enum1
    );
    await this.scrollToElement(config.keyInput as Locator);
  }

  async setAndSendSampleEnum(key: string, value: { enum1: string }) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.enum;
    await this.scrollToElement(config.keyInput as Locator);

    await (config.keyInput as Locator).fill(key);
    await (config.valueInput as Locator).click();
    await this.page.waitForTimeout(500);
    await (config.valueEnum1Input as Locator).fill(value.enum1);
    await (config.sendButton as Locator).click();
  }

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
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.structFiveElement;
    await this.scrollToElement(config.keyInput as Locator);
    await (config.keyInput as Locator).fill(key);
    await (config.valueInput as Locator).click();
    await this.page.waitForTimeout(500);

    const valueConfig = config.value as Record<string, Locator>;
    await valueConfig.element1.fill(value.element1);
    await valueConfig.element2.fill(value.element2);
    await valueConfig.element3.fill(value.element3);
    await valueConfig.element4.fill(value.element4);
    await valueConfig.element5.fill(value.element5);
    await (config.sendButton as Locator).click();
  }

  async setAndSendStructFourLayer(key: string, value: string) {
    await this.switchToWriteTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs.structFourLayer;
    await this.scrollToElement(config.keyInput as Locator);
    await (config.keyInput as Locator).fill(key);
    await (config.layer4 as Locator).click();
    await (config.layer3 as Locator).click();
    await (config.layer2 as Locator).click();
    await (config.layer1 as Locator).click();
    await (config.sendValueInput as Locator).fill(value);
    await (config.sendButton as Locator).click();
  }

  async readValue(
    configType: keyof typeof this.inputConfigs,
    key: string
  ): Promise<string> {
    await this.switchToReadTab();
    await this.page.waitForTimeout(500);

    const config = this.inputConfigs[configType];
    await this.scrollToElement(config.readValueInput as Locator);

    await (config.readValueInput as Locator).fill(key);
    await (config.readButton as Locator).click();
    await this.page.waitForTimeout(1000);

    return (await (config.readResultValue as Locator).textContent()) || "";
  }

  async readSampleStruct(key: string): Promise<string> {
    return this.readValue("struct", key);
  }

  async readNestedStruct(key: string): Promise<string> {
    return this.readValue("nestedStruct", key);
  }

  async readSampleEnum(key: string): Promise<string> {
    return this.readValue("enum", key);
  }

  async readStructFiveElement(key: string): Promise<string> {
    return this.readValue("structFiveElement", key);
  }

  async readStructFourLayer(key: string): Promise<string> {
    return this.readValue("structFourLayer", key);
  }

  async executeTest<T>(
    key: string,
    value: T,
    setAndSendFn: (key: string, value: T) => Promise<void>,
    readFn: (key: string) => Promise<string>
  ): Promise<TestResult> {
    await setAndSendFn.call(this, key, value);
    await this.page.waitForTimeout(3000);

    const isSuccess = await this.isTransactionCompleted();
    if (!isSuccess) return { success: false, actualValue: "" };

    const resultText = await readFn.call(this, key);
    return { success: !!value, actualValue: resultText };
  }

  async testSampleStruct(
    key: string,
    value: { structId: string; name: string; enum: { enum1: string } }
  ): Promise<TestResult> {
    return this.executeTest(
      key,
      value,
      this.setAndSendSampleStruct,
      this.readSampleStruct
    );
  }

  async testNestedStruct(
    key: string,
    value: {
      structUserContractAddress: string;
      structDataValue: {
        structDataId: string;
        structDataName: string;
        structDataStatus: { enum1: string };
      };
      structDataStatus: { enum1: string };
    }
  ): Promise<TestResult> {
    return this.executeTest(
      key,
      value,
      this.setAndSendNestedStruct,
      this.readNestedStruct
    );
  }

  async testSampleEnum(
    key: string,
    value: { enum1: string }
  ): Promise<TestResult> {
    return this.executeTest(
      key,
      value,
      this.setAndSendSampleEnum,
      this.readSampleEnum
    );
  }

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
    return this.executeTest(
      key,
      value,
      this.setAndSendStructFiveElement,
      this.readStructFiveElement
    );
  }

  async testStructFourLayer(key: string, value: string): Promise<TestResult> {
    return this.executeTest(
      key,
      value,
      this.setAndSendStructFourLayer,
      this.readStructFourLayer
    );
  }
}
