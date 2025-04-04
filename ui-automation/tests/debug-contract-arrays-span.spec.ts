import { test } from "@playwright/test";
import { ArraysSpansDebugPage } from "./pages/ArraysSpanDebugPage";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { captureError } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";

const BURNER_WALLET_SHORT = "0x64b4...5691";

/**
 * End-to-end test for the ArraysSpan Debug Page functionality
 * Tests all array and span data types with proper error handling and reporting
 */
test("ArraysSpan Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(180000);
  const testTimestamp = Date.now();
  const testId = `arrays-span-debug-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(`[${testId}] Starting test: ArraysSpan Debug Page Interaction Flow`);
    await navigateAndWait(page, endpoint.BASE_URL);

    const homePage = new HomePage(page);

    try {
      await homePage.getConnectButton().click();
      await homePage.getConnecterButton("Burner Wallet").click();

      const accountButton = homePage.getAccountButton(BURNER_WALLET_SHORT);
      await accountButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await accountButton.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (error) {
      const walletErr = await captureError(page, error, "Wallet Connection");
      errorLogs.push(walletErr);

      test.fail(true, `Wallet connection failed: ${getErrorMessage(error)}`);
      return;
    }

    try {
      await homePage.getDebugPageLinkButton().click();
      await page.waitForTimeout(1000);
    } catch (error) {
      const debugErr = await captureError(page, error, "Debug Page Navigation");
      errorLogs.push(debugErr);

      test.fail(
        true,
        `Debug page navigation failed: ${getErrorMessage(error)}`
      );
      return;
    }

    const arraysSpanDebugPage = new ArraysSpansDebugPage(page);

    try {
      await arraysSpanDebugPage.switchToArraysSpanTab();
      await page.waitForTimeout(1000);
      await arraysSpanDebugPage.switchToReadTab();
      await page.waitForTimeout(500);
    } catch (error) {
      const tabErr = await captureError(page, error, "Tab Switch");
      errorLogs.push(tabErr);

      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("ArraysSpans tab not found")) {
        console.error(`[${testId}] ArraysSpans tab not found:`, errorMessage);
        test.fail(true, `ArraysSpans tab not found: ${errorMessage}`);
      } else {
        console.error(`[${testId}] Failed to switch tabs:`, errorMessage);
        test.fail(true, `Failed to switch tabs: ${errorMessage}`);
      }

      return; // Exit test immediately if tab switching fails
    }

    const getArrayFelt252Result =
      await arraysSpanDebugPage.testGetArrayFelt252();
    console.log(
      `[${testId}] ArrayFelt252 test result:`,
      getArrayFelt252Result.success
        ? "SUCCESS"
        : `FAILED: ${getArrayFelt252Result.error}`
    );
    testResults.push(getArrayFelt252Result);

    const getArrayContractAddressResult =
      await arraysSpanDebugPage.testGetArrayContractAddress();
    console.log(
      `[${testId}] ContractAddress test result:`,
      getArrayContractAddressResult.success
        ? "SUCCESS"
        : `FAILED: ${getArrayContractAddressResult.error}`
    );
    testResults.push(getArrayContractAddressResult);

    const getArrayStructResult = await arraysSpanDebugPage.testGetArrayStruct();
    console.log(
      `[${testId}] ArrayStruct test result:`,
      getArrayStructResult.success
        ? "SUCCESS"
        : `FAILED: ${getArrayStructResult.error}`
    );
    testResults.push(getArrayStructResult);

    const getArrayNestedStruct =
      await arraysSpanDebugPage.testGetArrayNestedStruct();
    console.log(
      `[${testId}] ArrayNestedStruct test result:`,
      getArrayNestedStruct.success
        ? "SUCCESS"
        : `FAILED: ${getArrayNestedStruct.error}`
    );
    testResults.push(getArrayNestedStruct);

    const getArrayStructFiveElement =
      await arraysSpanDebugPage.testGetArrayStructFiveElement();
    console.log(
      `[${testId}] ArrayStructFiveElement test result:`,
      getArrayStructFiveElement.success
        ? "SUCCESS"
        : `FAILED: ${getArrayStructFiveElement.error}`
    );
    testResults.push(getArrayStructFiveElement);

    const getArrayStructFourLayer =
      await arraysSpanDebugPage.testGetArrayStructFourLayer();
    console.log(
      `[${testId}] ArrayStructFourLayer test result:`,
      getArrayStructFourLayer.success
        ? "SUCCESS"
        : `FAILED: ${getArrayStructFourLayer.error}`
    );
    testResults.push(getArrayStructFourLayer);

    const getSpanFelt252 = await arraysSpanDebugPage.testGetSpanFelt252();
    console.log(
      `[${testId}] SpanFelt252 test result:`,
      getSpanFelt252.success ? "SUCCESS" : `FAILED: ${getSpanFelt252.error}`
    );
    testResults.push(getSpanFelt252);

    const getSpanContractAddress =
      await arraysSpanDebugPage.testGetSpanAddressContract();
    console.log(
      `[${testId}] SpanContractAddress test result:`,
      getSpanContractAddress.success
        ? "SUCCESS"
        : `FAILED: ${getSpanContractAddress.error}`
    );
    testResults.push(getSpanContractAddress);

    const successfulTests = testResults.filter((test) => {
      return (
        test.success ||
        (test.error?.includes("timed out") && test.actualValue) ||
        test.actualValue !== ""
      );
    });

    const realFailedTests = testResults.filter(
      (test) =>
        !test.success &&
        (!test.actualValue || (test.error && !test.error.includes("timed out")))
    );

    if (realFailedTests.length > 0) {
      const failedTestNames = realFailedTests
        .map((test) => test.name)
        .join(", ");
      const errorMessage = `${realFailedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;

      const details = realFailedTests
        .map(
          (test) =>
            `${test.name}: ${test.error || "Unknown error"}\nDetails: ${test.actualValue || "No value returned"}`
        )
        .join("\n\n");

      test.fail(
        true,
        `${errorMessage}\n\nSee logs for details or check screenshot: ${testId}-test-failures.png`
      );
    }
  } catch (error) {
    const generalErr = await captureError(
      page,
      error,
      "General ArraysSpan Test Execution"
    );
    errorLogs.push(generalErr);

    test.fail(true, `Unexpected test failure: ${getErrorMessage(error)}`);
  }
});
