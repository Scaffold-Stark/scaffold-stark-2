import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { StructsDebugPage } from "./pages/StructsDebugPage";

const BURNER_WALLET_SHORT = "0x64b4...5691";

test("Structs Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(90000);

  await navigateAndWait(page, endpoint.BASE_URL);

  const homePage = new HomePage(page);

  await homePage.getConnectButton().click();
  await homePage.getConnecterButton("Burner Wallet").click();

  const accountButton = homePage.getAccountButton(BURNER_WALLET_SHORT);
  await accountButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await accountButton.click({ force: true, timeout: 5000 });
  await page.waitForTimeout(1000);

  await homePage.getDebugPageLinkButton().click();
  await page.waitForTimeout(1000);

  const structsDebugPage = new StructsDebugPage(page);

  await structsDebugPage.switchToStructsTab();
  await page.waitForTimeout(1000);
  const testResults = [];

  const sampleStruct = await structsDebugPage.testSampleStruct(
    "sample_struct",
    {
      structId: "1",
      name: "Test Asset",
      enum: {
        enum1: "1",
      },
    }
  );

  console.log(
    "SampleStruct test result :",
    JSON.parse(sampleStruct.actualValue)
  );

  testResults.push({
    name: "SampleStruct",
    success: sampleStruct.success,
    details: sampleStruct.actualValue,
  });

  const nestedStruct = await structsDebugPage.testNestedStruct(
    "nested_struct",
    {
      structUserContractAddress:
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      structDataStatus: { enum1: "1" },
      structDataValue: {
        structDataId: "1",
        structDataName: "Test",
        structDataStatus: {
          enum1: "1",
        },
      },
    }
  );

  console.log(
    "NestedStruct test result :",
    JSON.parse(nestedStruct.actualValue)
  );
  testResults.push({
    name: "NestedStruct",
    success: nestedStruct.success,
    details: nestedStruct.actualValue,
  });

  const sampleEnum = await structsDebugPage.testSampleEnum("sample_enum", {
    enum1: "2",
  });

  console.log("SampleEnum test result :", JSON.parse(sampleEnum.actualValue));

  testResults.push({
    name: "SampleEnum",
    success: sampleEnum.success,
    details: sampleEnum.actualValue,
  });

  const structFiveElement = await structsDebugPage.testStructFiveElement(
    "struct_with_five_elements",
    {
      element1: "1",
      element2: "2",
      element3: "Pending Test",
      element4:
        "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      element5: "true",
    }
  );

  console.log(
    "StructFiveElement test result :",
    JSON.parse(structFiveElement.actualValue)
  );

  testResults.push({
    name: "StructFiveElement",
    success: structFiveElement.success,
    details: structFiveElement.actualValue,
  });

  const structFourLayer = await structsDebugPage.testStructFourLayer(
    "struct_with_four_layers",
    "9000000000000000000"
  );

  console.log("StructFourLayer test result :", structFourLayer.actualValue);

  testResults.push({
    name: "StructFourLayer",
    success: structFourLayer.success,
    details: structFourLayer.actualValue,
  });

  const failedTests = testResults.filter((test) => !test.success);

  if (failedTests.length > 0) {
    const failedTestNames = failedTests.map((test) => test.name).join(", ");
    const errorMessage = `Failure case: ${failedTestNames}`;

    const details = failedTests
      .map((test) => `${test.name}: ${JSON.stringify(test.details)}`)
      .join("\n");

    console.error(`${errorMessage}\n${details}`);
    test.fail(true, errorMessage);
  }
});
