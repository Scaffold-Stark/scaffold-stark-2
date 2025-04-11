import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { ComplexDebugPage } from "./pages/ComplexDebugPage";
import { captureError, formatTestResults } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";

const BURNER_WALLET_SHORT = "0x64b4...5691";

/**
 * End-to-end test for Complex Debug Page functionality
 * Tests complex data structures including structs with tuples
 */
test("Complex Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(150000);
  const testTimestamp = Date.now();
  const testId = `complex-debug-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(
      `[${testId}] Starting test: Complex Debug Page Interaction Flow`
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

    const complexDebugPage = new ComplexDebugPage(page);
    try {
      await complexDebugPage.switchToVarsTab();
      await page.waitForTimeout(1000);
      console.log(`[${testId}] Successfully switched to Complex tab`);
    } catch (error) {
      const tabErr = await captureError(page, error, "Tab Switch");
      errorLogs.push(tabErr);
      console.error(
        `[${testId}] Failed to switch to Complex tab:`,
        tabErr.message
      );

      test.fail(
        true,
        `Failed to switch to Complex tab: ${getErrorMessage(error)}`
      );
      return; // Exit test immediately if tab is not found
    }

    console.log(`[${testId}] Starting StructWithTuple test`);
    const structWithTuple = await complexDebugPage.testStructWithTuple(
      "struct_with_tuple_key",
      {
        tupleElement: "(1,Starknet,true)",
        contractAddress:
          "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
      }
    );

    console.log(
      `[${testId}] StructWithTuple test result:`,
      structWithTuple.success ? "SUCCESS" : `FAILED: ${structWithTuple.error}`
    );
    testResults.push(structWithTuple);

    console.log(`[${testId}] Starting ComplexStruct test`);
    const complexStruct = await complexDebugPage.testComplexStruct(
      "complex_struct_key",
      {
        id: "256",
        sampleStruct: {
          id: "52",
          name: "StarknetByteArray",
          enum: {
            enum1: "1",
            enum2: "2",
            enum3: "SpeedRun",
          },
        },
        status: "true",
        layer1Element: "42",
        tupleData: "(12,ScaffoldStark)",
      }
    );

    console.log(
      `[${testId}] ComplexStruct test result:`,
      complexStruct.success ? "SUCCESS" : `FAILED: ${complexStruct.error}`
    );
    testResults.push(complexStruct);

    const failedTests = testResults.filter((test) => !test.success);

    if (failedTests.length > 0) {
      const formattedResults = formatTestResults(testResults);
      console.error(`[${testId}] TEST SUMMARY:\n${formattedResults}`);

      const failedTestNames = failedTests.map((test) => test.name).join(", ");
      const errorMessage = `${failedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;

      const details = failedTests
        .map(
          (test) =>
            `${test.name}: ${test.error || "Unknown error"}\nDetails: ${JSON.stringify(test.details)}`
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
