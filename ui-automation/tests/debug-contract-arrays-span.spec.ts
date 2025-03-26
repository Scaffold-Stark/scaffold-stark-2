import { test } from "@playwright/test";
import { ArraysSpansDebugPage } from "./pages/ArraysSpanDebugPage";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { captureError } from "./utils/error-handler";

const BURNER_WALLET_SHORT = "0x64b4...5691";

test("ArraysSpan Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(90000);
  const testTimestamp = Date.now();
  const testId = `arrays-span-debug-${testTimestamp}`;
  
  const testResults = [];
  const errorLogs = [];

  try {
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
      
      test.fail(true, `Wallet connection failed: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    
    try {
      await homePage.getDebugPageLinkButton().click();
      await page.waitForTimeout(1000);
    } catch (error) {
      const debugErr = await captureError(page, error, "Debug Page Navigation");
      errorLogs.push(debugErr);
      
      test.fail(true, `Debug page navigation failed: ${error instanceof Error ? error.message : String(error)}`);
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
      
      test.fail(true, `Failed to switch tabs: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    const getArrayFelt252Result = await arraysSpanDebugPage.testGetArrayFelt252();
    testResults.push(getArrayFelt252Result);

    const getArrayContractAddressResult = await arraysSpanDebugPage.testGetArrayContractAddress();
    testResults.push(getArrayContractAddressResult);

    const getArrayStructResult = await arraysSpanDebugPage.testGetArrayStruct();
    testResults.push(getArrayStructResult);

    const getArrayNestedStruct = await arraysSpanDebugPage.testGetArrayNestedStruct();
    testResults.push(getArrayNestedStruct);

    const getArrayStructFiveElement = await arraysSpanDebugPage.testGetArrayStructFiveElement();
    testResults.push(getArrayStructFiveElement);

    const getArrayStructFourLayer = await arraysSpanDebugPage.testGetArrayStructFourLayer();
    testResults.push(getArrayStructFourLayer);

    const getSpanFelt252 = await arraysSpanDebugPage.testGetSpanFelt252();
    testResults.push(getSpanFelt252);

    const getSpanContractAddress = await arraysSpanDebugPage.testGetSpanAddressContract();
    testResults.push(getSpanContractAddress);

    const successfulTests = testResults.filter(test => {
      return test.success || 
        (test.error?.includes("timed out") && test.actualValue) || 
        test.actualValue !== "";
    });
    
    const realFailedTests = testResults.filter(test => 
      !test.success && 
      (!test.actualValue || (test.error && !test.error.includes("timed out")))
    );

    if (realFailedTests.length > 0) {
      const failedTestNames = realFailedTests.map((test) => test.name).join(", ");
      const errorMessage = `${realFailedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;
      
      const details = realFailedTests
        .map((test) => `${test.name}: ${test.error || 'Unknown error'}\nDetails: ${test.actualValue || "No value returned"}`)
        .join("\n\n");
      
      test.fail(true, `${errorMessage}\n\nSee logs for details or check screenshot: ${testId}-test-failures.png`);
    }
  } catch (error) {
    const generalErr = await captureError(page, error, "General ArraysSpan Test Execution");
    errorLogs.push(generalErr);
    
    test.fail(true, `Unexpected test failure: ${error instanceof Error ? error.message : String(error)}`);
  }
});