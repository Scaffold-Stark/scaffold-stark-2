import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { VarsDebugPage } from "./pages/VarsDebugPage";
import { captureError, formatTestResults } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";

const BURNER_WALLET_SHORT = "0x64b4...5691";

/**
 * End-to-end test for Variables Debug Page functionality
 * Tests various primitive data types including felt252, felt, ByteArray, ContractAddress, and boolean
 */
test("Vars Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(150000);
  const testTimestamp = Date.now();
  const testId = `vars-debug-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(`[${testId}] Starting test: Vars Debug Page Interaction Flow`);

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
      await page.waitForTimeout(3000);
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

    const varsDebugPage = new VarsDebugPage(page);

    try {
      await varsDebugPage.switchToVarsTab();
      await page.waitForTimeout(1000);
      console.log(`[${testId}] Successfully switched to Vars tab`);
    } catch (error) {
      const tabErr = await captureError(page, error, "Tab Switch");
      errorLogs.push(tabErr);
      console.error(
        `[${testId}] Failed to switch to Vars tab:`,
        tabErr.message
      );

      test.fail(
        true,
        `Failed to switch to Vars tab: ${getErrorMessage(error)}`
      );
      return; // Exit test immediately if tab is not found
    }

    const felt252Result = await varsDebugPage.testFelt252(
      "u256_felt256_key",
      "42"
    );
    console.log(
      `[${testId}] Felt252 test result:`,
      felt252Result.success ? "SUCCESS" : `FAILED: ${felt252Result.error}`
    );
    testResults.push({
      ...felt252Result,
      name: "Felt252",
    });

    const feltResult = await varsDebugPage.testFelt("0x123", "0x456");
    console.log(
      `[${testId}] Felt test result:`,
      feltResult.success ? "SUCCESS" : `FAILED: ${feltResult.error}`
    );
    testResults.push({
      ...feltResult,
      name: "Felt",
    });

    const byteArrayResult = await varsDebugPage.testByteArray(
      "byte_array",
      "Hello Starknet"
    );
    console.log(
      `[${testId}] ByteArray test result:`,
      byteArrayResult.success ? "SUCCESS" : `FAILED: ${byteArrayResult.error}`
    );
    testResults.push({
      ...byteArrayResult,
      name: "ByteArray",
    });

    const contractAddressResult = await varsDebugPage.testContractAddress(
      "contract_address",
      "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"
    );
    console.log(
      `[${testId}] ContractAddress test result:`,
      contractAddressResult.success
        ? "SUCCESS"
        : `FAILED: ${contractAddressResult.error}`
    );
    testResults.push({
      ...contractAddressResult,
      name: "ContractAddress",
    });

    const boolResult = await varsDebugPage.testBool(
      "bool_key",
      "true" as "true" | "false"
    );
    console.log(
      `[${testId}] Bool test result:`,
      boolResult.success ? "SUCCESS" : `FAILED: ${boolResult.error}`
    );
    testResults.push({
      ...boolResult,
      name: "Bool",
    });

    const bytes31Result = await varsDebugPage.testBytes31("0x1234", "0x12345");
    console.log(
      `[${testId}] Bytes31 test result:`,
      bytes31Result.success ? "SUCCESS" : `FAILED: ${bytes31Result.error}`
    );
    testResults.push({
      ...bytes31Result,
      name: "Bytes31",
    });

    const i8Result = await varsDebugPage.testI8("0x1234", "10");
    console.log(
      `[${testId}] I8 test result:`,
      i8Result.success ? "SUCCESS" : `FAILED: ${i8Result.error}`
    );
    testResults.push({
      ...i8Result,
      name: "I8",
    });


    // const nonZeroU256 = await varsDebugPage.testNonZeroU256("0x12");
    // console.log(
    //   `[${testId}] nonZeroU256 test result:`,
    //   nonZeroU256.success ? "SUCCESS" : `FAILED: ${nonZeroU256.error}`
  // );
    // testResults.push({
    //   ...nonZeroU256,
    //   name: "nonZeroU256",
    // });

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
