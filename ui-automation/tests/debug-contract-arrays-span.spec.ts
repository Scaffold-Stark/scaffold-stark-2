import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { captureError } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";
import { ArraysSpansPage } from "./pages/ArraysSpanDebugPage";

const BURNER_WALLET_SHORT = "0x64b4...5691";

/**
 * End-to-end test for the ArraysSpan Page with ArrayValue functionality
 * Tests array operations with struct and nested struct data types
 */
test("ArrayValue Interaction Flow", async ({ page }) => {
  test.setTimeout(180000);
  const testTimestamp = Date.now();
  const testId = `array-value-test-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(`[${testId}] Starting test: ArrayValue Interaction Flow`);
    await navigateAndWait(page, endpoint.BASE_URL);

    const homePage = new HomePage(page);

    try {
      // Connect wallet
      await homePage.getConnectButton().click();
      await homePage.getConnecterButton("Burner Wallet").click();

      // Select account
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
      // Navigate to debug page
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

    const arraysSpansPage = new ArraysSpansPage(page);

    try {
      // Switch to ArraysSpan tab and Read tab
      await arraysSpansPage.switchToArraysSpanTab();
      await page.waitForTimeout(1000);
      await arraysSpansPage.switchToReadTab();
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

    // Run the ArrayValueStruct test
    const arrayValueStructResult = await arraysSpansPage.testGetArrayValueStruct();
    console.log(
      `[${testId}] ArrayValueStruct test result:`,
      arrayValueStructResult.success
        ? "SUCCESS"
        : `FAILED: ${arrayValueStructResult.error}`
    );
    testResults.push(arrayValueStructResult);

    // Run the ArrayValueNestedStruct test
    const arrayValueNestedStructResult = await arraysSpansPage.testGetArrayValueNestedStruct();
    console.log(
      `[${testId}] ArrayValueNestedStruct test result:`,
      arrayValueNestedStructResult.success
        ? "SUCCESS"
        : `FAILED: ${arrayValueNestedStructResult.error}`
    );
    testResults.push(arrayValueNestedStructResult);

    // Determine if test failed
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

      test.fail(
        true,
        `${errorMessage}\n\nSee logs for details or check screenshot: ${testId}-test-failures.png`
      );
    } else {
      console.log(`[${testId}] Test completed successfully`);
    }
  } catch (error) {
    const generalErr = await captureError(
      page,
      error,
      "General ArrayValue Test Execution"
    );
    errorLogs.push(generalErr);

    test.fail(true, `Unexpected test failure: ${getErrorMessage(error)}`);
  }
});