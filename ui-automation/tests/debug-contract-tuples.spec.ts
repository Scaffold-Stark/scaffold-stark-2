import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { captureError, formatTestResults } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";
import { TuplesDebugPage } from "./pages/TuplesDebugPage";

const BURNER_WALLET_SHORT = "0x64b4...5691";

/**
 * End-to-end test for Tuples Debug Page functionality
 * Tests tuple4_mixed data type
 */
test("Tuples Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(120000);
  const testTimestamp = Date.now();
  const testId = `tuples-debug-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(
      `[${testId}] Starting test: Tuples Debug Page Interaction Flow`
    );

    try {
      await navigateAndWait(page, endpoint.BASE_URL);
      console.log(`[${testId}] Successfully navigated to ${endpoint.BASE_URL}`);
    } catch (error) {
      const navErr = await captureError(page, error, "Navigation");
      errorLogs.push(navErr);
      console.error(`[${testId}] Navigation failed:`, navErr.message);

      test.fail(true, `Navigation failed: ${getErrorMessage(error)}`);
      return;
    }

    const homePage = new HomePage(page);

    try {
      await homePage.getConnectButton().click();
      await homePage.getConnecterButton("Burner Wallet").click();

      const accountButton = homePage.getAccountButton(BURNER_WALLET_SHORT);
      await accountButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await accountButton.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1000);

      console.log(
        `[${testId}] Successfully connected to wallet: ${BURNER_WALLET_SHORT}`
      );
    } catch (error) {
      const walletErr = await captureError(page, error, "Wallet Connection");
      errorLogs.push(walletErr);
      console.error(`[${testId}] Wallet connection failed:`, walletErr.message);

      test.fail(true, `Wallet connection failed: ${getErrorMessage(error)}`);
      return;
    }

    try {
      await homePage.getDebugPageLinkButton().click();
      await page.waitForTimeout(1000);
      console.log(`[${testId}] Successfully navigated to debug page`);
    } catch (error) {
      const debugErr = await captureError(page, error, "Debug Page Navigation");
      errorLogs.push(debugErr);
      console.error(
        `[${testId}] Debug page navigation failed:`,
        debugErr.message
      );

      test.fail(
        true,
        `Debug page navigation failed: ${getErrorMessage(error)}`
      );
      return;
    }

    const tuplesDebugPage = new TuplesDebugPage(page);

    try {
      await tuplesDebugPage.switchToTuplesTab();
      await page.waitForTimeout(1000);
      console.log(`[${testId}] Successfully switched to Tuples tab`);
    } catch (error) {
      const tabErr = await captureError(page, error, "Tab Switch");
      errorLogs.push(tabErr);
      console.error(
        `[${testId}] Failed to switch to Tuples tab:`,
        tabErr.message
      );

      test.fail(
        true,
        `Failed to switch to Tuples tab: ${getErrorMessage(error)}`
      );
      return; // Exit test immediately if tab is not found
    }

    const tuple4MixedResult = await tuplesDebugPage.testTuple4Mixed(
      "tuple_4_mixed",
      "(0x03DBa621D6fB7281064727E6201b17008319f93827F2bF61A20C0CB73e9918BA,0x123,128,8)"
    );
    console.log(
      `[${testId}] Tuple4Mixed test result:`,
      tuple4MixedResult.success
        ? "SUCCESS"
        : `FAILED: ${tuple4MixedResult.error}`
    );
    testResults.push({
      ...tuple4MixedResult,
      name: "Tuple4Mixed",
    });

    const tupleByteArrayResult = await tuplesDebugPage.testTupleByteArray(
      "tuple_byte_array_key",
      "(Hello Starknet, 0x2a, 1000)"
    );
    console.log(
      `[${testId}] TupleByteArray test result:`,
      tupleByteArrayResult.success
        ? "SUCCESS"
        : `FAILED: ${tupleByteArrayResult.error}`
    );
    testResults.push({
      ...tupleByteArrayResult,
      name: "TupleByteArray",
    });

    const failedTests = testResults.filter((test) => !test.success);

    if (failedTests.length > 0) {
      const formattedResults = formatTestResults(testResults);
      console.error(`[${testId}] TEST SUMMARY:\n${formattedResults}`);

      const failedTestNames = failedTests.map((test) => test.name).join(", ");
      const errorMessage = `${failedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;

      const details = failedTests
        .map(
          (test) =>
            `${test.name}: ${test.error}\nActual: ${test.actualValue}\nDetails: ${JSON.stringify(test.details)}`
        )
        .join("\n\n");

      console.error(`[${testId}] DETAILED TEST FAILURES:\n${details}`);
      test.fail(
        true,
        `${errorMessage}\n\nSee logs for details or check screenshot: ${testId}-test-failures.png`
      );
    } else {
      console.log(`[${testId}] All tests passed successfully!`);
    }
  } catch (error) {
    const generalErr = await captureError(
      page,
      error,
      "General Test Execution"
    );
    errorLogs.push(generalErr);
    console.error(
      `[${testId}] Test execution failed with unexpected error:`,
      generalErr.message
    );

    test.fail(true, `Unexpected test failure: ${getErrorMessage(error)}`);
  }
});
