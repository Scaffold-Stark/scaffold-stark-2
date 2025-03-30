import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { StructsDebugPage } from "./pages/StructsDebugPage";
import { captureError, formatTestResults } from "./utils/error-handler";
import { getErrorMessage } from "./utils/helper";

const BURNER_WALLET_SHORT = "0x64b4...5691";

test("Structs Debug Page Interaction Flow", async ({ page }) => {
  test.setTimeout(150000);
  const testTimestamp = Date.now();
  const testId = `structs-debug-${testTimestamp}`;
  
  const testResults = [];
  const errorLogs = [];

  try {
    console.log(`[${testId}] Starting test: Structs Debug Page Interaction Flow`);
    
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
      
      console.log(`[${testId}] Successfully connected to wallet: ${BURNER_WALLET_SHORT}`);
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
      console.error(`[${testId}] Debug page navigation failed:`, debugErr.message);
      
      test.fail(true, `Debug page navigation failed: ${getErrorMessage(error)}`);
      return;
    }

    const structsDebugPage = new StructsDebugPage(page);

    try {
      await structsDebugPage.switchToStructsTab();
      await page.waitForTimeout(1000);
      console.log(`[${testId}] Successfully switched to Structs tab`);
    } catch (error) {
      const tabErr = await captureError(page, error, "Tab Switch");
      errorLogs.push(tabErr);
      console.error(`[${testId}] Failed to switch to Structs tab:`, tabErr.message);
      
      test.fail(true, `Failed to switch to Structs tab: ${getErrorMessage(error)}`);
      return; // Exit test immediately if tab is not found
    }

    console.log(`[${testId}] Starting SampleStruct test`);
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

    console.log(`[${testId}] SampleStruct test result:`, 
      sampleStruct.success ? "SUCCESS" : `FAILED: ${sampleStruct.error}`);
    testResults.push(sampleStruct);

    console.log(`[${testId}] Starting NestedStruct test`);
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

    console.log(`[${testId}] NestedStruct test result:`, 
      nestedStruct.success ? "SUCCESS" : `FAILED: ${nestedStruct.error}`);
    testResults.push(nestedStruct);

    console.log(`[${testId}] Starting SampleEnum test`);
    const sampleEnum = await structsDebugPage.testSampleEnum("sample_enum", {
      enum1: "2",
    });

    console.log(`[${testId}] SampleEnum test result:`, 
      sampleEnum.success ? "SUCCESS" : `FAILED: ${sampleEnum.error}`);
    testResults.push(sampleEnum);

    console.log(`[${testId}] Starting StructFiveElement test`);
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

    console.log(`[${testId}] StructFiveElement test result:`, 
      structFiveElement.success ? "SUCCESS" : `FAILED: ${structFiveElement.error}`);
    testResults.push(structFiveElement);

    console.log(`[${testId}] Starting StructFourLayer test`);
    const structFourLayer = await structsDebugPage.testStructFourLayer(
      "struct_with_four_layers",
      "9000000000000000000"
    );

    console.log(`[${testId}] StructFourLayer test result:`, 
      structFourLayer.success ? "SUCCESS" : `FAILED: ${structFourLayer.error}`);
    testResults.push(structFourLayer);

    const failedTests = testResults.filter((test) => !test.success);

    if (failedTests.length > 0) {
      const formattedResults = formatTestResults(testResults);
      console.error(`[${testId}] TEST SUMMARY:\n${formattedResults}`);
      
      
      const failedTestNames = failedTests.map((test) => test.name).join(", ");
      const errorMessage = `${failedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;
      
      const details = failedTests
        .map((test) => `${test.name}: ${test.error || 'Unknown error'}\nDetails: ${JSON.stringify(test.details)}`)
        .join("\n\n");
      
      console.error(`[${testId}] DETAILED TEST FAILURES:\n${details}`);
      test.fail(true, `${errorMessage}\n\nSee logs for details or check screenshot: ${testId}-test-failures.png`);
    } else {
      console.log(`[${testId}] All tests passed successfully!`);
    }
  } catch (error) {
    const generalErr = await captureError(page, error, "General Test Execution");
    errorLogs.push(generalErr);
    console.error(`[${testId}] Test execution failed with unexpected error:`, generalErr.message);
    
    test.fail(true, `Unexpected test failure: ${getErrorMessage(error)}`);
  }
});
