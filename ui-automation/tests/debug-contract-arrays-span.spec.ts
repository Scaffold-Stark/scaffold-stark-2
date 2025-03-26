import test from "playwright/test";
import { ArraysSpansDebugPage } from "./pages/ArraysSpanDebugPage";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";

const BURNER_WALLET_SHORT = "0x64b4...5691";

test("ArraysSpan Debug Page Interaction Flow", async ({ page }) => {
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

  const arraysSpanDebugPage = new ArraysSpansDebugPage(page);

  await arraysSpanDebugPage.switchToArraysSpanTab();
  await page.waitForTimeout(1000);
  await arraysSpanDebugPage.switchToReadTab();
  await page.waitForTimeout(500);

  const testResults = [];

  const getArrayFelt252Result = await arraysSpanDebugPage.testGetArrayFelt252();
  console.log(
    "Array felt252 test result : ",
    JSON.parse(getArrayFelt252Result.actualValue)
  );
  testResults.push({
    name: "ArrayFelt252",
    success: getArrayFelt252Result.success,
    details: getArrayFelt252Result.actualValue,
  });

  const getArrayContractAddressResult =
    await arraysSpanDebugPage.testGetArrayContractAddress();
  console.log(
    "Array Contract Address test result : ",
    JSON.parse(getArrayContractAddressResult.actualValue)
  );
  testResults.push({
    name: "ArrayContractAddress",
    success: getArrayContractAddressResult.success,
    details: getArrayContractAddressResult.actualValue,
  });

  const getArrayStructResult = await arraysSpanDebugPage.testGetArrayStruct();
  console.log(
    "Array Struct test result : ",
    JSON.parse(getArrayStructResult.actualValue)
  );
  testResults.push({
    name: "ArrayStruct",
    success: getArrayStructResult.success,
    details: getArrayStructResult.actualValue,
  });

  const getArrayNestedStruct =
    await arraysSpanDebugPage.testGetArrayNestedStruct();
  console.log(
    "Array NestedStruct test result : ",
    JSON.parse(getArrayNestedStruct.actualValue)
  );
  testResults.push({
    name: "ArrayNestedStruct",
    success: getArrayNestedStruct.success,
    details: getArrayNestedStruct.actualValue,
  });

  const getArrayStructFiveElement =
    await arraysSpanDebugPage.testGetArrayStructFiveElement();
  console.log(
    "Array Struct Five Element test result : ",
    JSON.parse(getArrayStructFiveElement.actualValue)
  );
  testResults.push({
    name: "ArrayStructFiveElement",
    success: getArrayStructFiveElement.success,
    details: getArrayStructFiveElement.actualValue,
  });

  const getArrayStructFourLayer =
    await arraysSpanDebugPage.testGetArrayStructFourLayer();
  console.log(
    "Array Struct Four Layer test result : ",
    JSON.parse(getArrayStructFourLayer.actualValue)
  );
  testResults.push({
    name: "ArrayStructFourLayer",
    success: getArrayStructFourLayer.success,
    details: getArrayStructFourLayer.actualValue,
  });

  const getSpanFelt252 = await arraysSpanDebugPage.testGetSpanFelt252();
  console.log(
    "Span Felt252 test result : ",
    JSON.parse(getSpanFelt252.actualValue)
  );
  testResults.push({
    name: "SpanFelt252",
    success: getSpanFelt252.success,
    details: getSpanFelt252.actualValue,
  });

  const getSpanContractAddress =
    await arraysSpanDebugPage.testGetSpanAddressContract();
  console.log(
    "Span ContractAddress test result : ",
    JSON.parse(getSpanContractAddress.actualValue)
  );
  testResults.push({
    name: "SpanContractAddress",
    success: getSpanContractAddress.success,
    details: getSpanContractAddress.actualValue,
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
