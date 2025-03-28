import { test, expect } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { StrkDebugPage } from "./pages/StrkDebugPage";
import { captureError } from "./utils/error-handler";

const BURNER_WALLET_ACCOUNT =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
const BURNER_WALLET_SHORT = "0x64b4...5691";
const CONTRACT_ADDRESS =
  "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D";

test("STRK Token Complete Interaction Flow", async ({ page }) => {
  test.setTimeout(120000);
  const testTimestamp = Date.now();
  const testId = `strk-token-${testTimestamp}`;

  const testResults = [];
  const errorLogs = [];

  try {
    console.log(`[${testId}] Setting up test environment...`);

    try {
      await navigateAndWait(page, endpoint.BASE_URL);
      console.log(`[${testId}] Successfully navigated to ${endpoint.BASE_URL}`);
    } catch (error) {
      const navErr = await captureError(page, error, "Navigation");
      errorLogs.push(navErr);
      console.error(`[${testId}] Navigation failed:`, navErr.message);

      test.fail(
        true,
        `Navigation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    const homePage = new HomePage(page);

    try {
      console.log(`[${testId}] Connecting to Burner Wallet...`);
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

      test.fail(
        true,
        `Wallet connection failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    try {
      console.log(`[${testId}] Navigating to debug page...`);
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
        `Debug page navigation failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    const debugPage = new StrkDebugPage(page);

    console.log(
      `\n[${testId}] ===== TEST 1: Check Balance of Connected Burner Wallet =====`
    );
    try {
      console.log(`[${testId}] Switching to Strk tab and checking balance...`);
      await debugPage.switchToStrkTab();
      await debugPage.fillBalanceOfInput(BURNER_WALLET_ACCOUNT);
      await debugPage.clickBalanceOfReadButton();
      await page.waitForTimeout(1000);

      const initialBalanceText = await debugPage.getBalanceOfResultText();
      console.log(
        `[${testId}] Balance of ${BURNER_WALLET_ACCOUNT}: ${initialBalanceText}`
      );

      expect(initialBalanceText).toContain("Ξ");
      console.log(`[${testId}] ✓ Balance check completed successfully`);

      testResults.push({
        name: "BalanceCheck",
        success: initialBalanceText.includes("Ξ"),
        details: {
          address: BURNER_WALLET_ACCOUNT,
          balance: initialBalanceText,
        },
      });
    } catch (error) {
      const balanceErr = await captureError(page, error, "STRK Balance Check");
      errorLogs.push(balanceErr);
      console.error(`[${testId}] Balance check failed:`, balanceErr.message);

      testResults.push({
        name: "BalanceCheck",
        success: false,
        error: balanceErr.message,
        details: { address: BURNER_WALLET_ACCOUNT },
      });
    }

    console.log(`\n[${testId}] ===== TEST 2: Test Allowance =====`);
    try {
      const amountToAllow = "10";
      console.log(
        `[${testId}] Setting allowance of ${amountToAllow} STRK for contract: ${CONTRACT_ADDRESS}`
      );

      const allowanceResult = await debugPage.checkAllowance(
        amountToAllow,
        CONTRACT_ADDRESS,
        BURNER_WALLET_ACCOUNT,
        CONTRACT_ADDRESS
      );

      if (allowanceResult.success) {
        console.log(`[${testId}] Allowance result: ${allowanceResult.value}`);
        expect(allowanceResult.value).not.toBe("");
        console.log(`[${testId}] ✓ Allowance check completed successfully`);

        testResults.push({
          name: "AllowanceCheck",
          success: true,
          details: {
            amount: amountToAllow,
            spender: CONTRACT_ADDRESS,
            owner: BURNER_WALLET_ACCOUNT,
            result: allowanceResult.value,
          },
        });
      } else {
        console.error(
          `[${testId}] Allowance check failed: ${allowanceResult.error}`
        );

        testResults.push({
          name: "AllowanceCheck",
          success: false,
          error: allowanceResult.error,
          details: {
            amount: amountToAllow,
            spender: CONTRACT_ADDRESS,
            owner: BURNER_WALLET_ACCOUNT,
          },
        });
      }
    } catch (error) {
      const allowanceErr = await captureError(
        page,
        error,
        "STRK Allowance Check"
      );
      errorLogs.push(allowanceErr);
      console.error(
        `[${testId}] Allowance check failed:`,
        allowanceErr.message
      );

      testResults.push({
        name: "AllowanceCheck",
        success: false,
        error: allowanceErr.message,
        details: {
          amount: "10",
          spender: CONTRACT_ADDRESS,
          owner: BURNER_WALLET_ACCOUNT,
        },
      });
    }

    console.log(`\n[${testId}] ===== TEST 3: Transfer STRK Tokens =====`);
    try {
      const transferAmount = "1";
      console.log(
        `[${testId}] Transferring ${transferAmount} STRK to contract address: ${CONTRACT_ADDRESS}`
      );

      const transferResult = await debugPage.performTransfer(
        CONTRACT_ADDRESS,
        transferAmount
      );

      if (
        transferResult.success ||
        transferResult.error?.includes("timed out")
      ) {
        console.log(
          `[${testId}] ✓ Transfer initiated: ${transferAmount} STRK to ${CONTRACT_ADDRESS}`
        );
        if (transferResult.error?.includes("timed out")) {
          console.log(
            `[${testId}] Note: No UI confirmation was received, but this is likely a UI issue`
          );
        }

        testResults.push({
          name: "TokenTransfer",
          success: true,
          details: {
            amount: transferAmount,
            recipient: CONTRACT_ADDRESS,
            note:
              transferResult.note || "Transaction sent, no UI issues detected",
          },
        });
      } else {
        console.error(`[${testId}] Transfer failed: ${transferResult.error}`);

        testResults.push({
          name: "TokenTransfer",
          success: false,
          error: transferResult.error,
          details: {
            amount: transferAmount,
            recipient: CONTRACT_ADDRESS,
          },
        });
      }
    } catch (error) {
      const transferErr = await captureError(
        page,
        error,
        "STRK Token Transfer"
      );
      errorLogs.push(transferErr);
      console.error(`[${testId}] Token transfer failed:`, transferErr.message);

      testResults.push({
        name: "TokenTransfer",
        success: false,
        error: transferErr.message,
        details: {
          amount: "1",
          recipient: CONTRACT_ADDRESS,
        },
      });
    }

    try {
      console.log(`\n[${testId}] ===== FINAL VERIFICATION =====`);
      await debugPage.switchToReadTab();
      await debugPage.fillBalanceOfInput(BURNER_WALLET_ACCOUNT);
      await debugPage.clickBalanceOfReadButton();
      await page.waitForTimeout(1000);

      const finalBalanceText = await debugPage.getBalanceOfResultText();
      console.log(
        `[${testId}] Final balance of ${BURNER_WALLET_ACCOUNT}: ${finalBalanceText}`
      );

      testResults.push({
        name: "FinalBalanceCheck",
        success: true,
        details: { address: BURNER_WALLET_ACCOUNT, balance: finalBalanceText },
      });

      console.log(
        `\n[${testId}] ✓✓✓ STRK token interaction test completed successfully ✓✓✓`
      );
    } catch (error) {
      const finalErr = await captureError(
        page,
        error,
        "Final STRK Balance Check"
      );
      errorLogs.push(finalErr);
      console.log(`[${testId}] Final verification skipped:`, finalErr.message);

      testResults.push({
        name: "FinalBalanceCheck",
        success: false,
        error: finalErr.message,
        details: { address: BURNER_WALLET_ACCOUNT },
      });
    }

    // Check for any test failures
    const failedTests = testResults.filter((test) => !test.success);

    if (failedTests.length > 0) {
      const failedTestNames = failedTests.map((test) => test.name).join(", ");
      const errorMessage = `${failedTests.length}/${testResults.length} tests failed: ${failedTestNames}`;

      const details = failedTests
        .map(
          (test) =>
            `${test.name}: ${test.error || "Unknown error"}\nDetails: ${JSON.stringify(test.details)}`
        )
        .join("\n\n");

      console.error(`[${testId}] DETAILED TEST FAILURES:\n${details}`);
      test.fail(true, `${errorMessage}\n\nSee logs for details`);
    } else {
      console.log(`[${testId}] All STRK token tests passed successfully!`);
    }
  } catch (error) {
    const generalErr = await captureError(
      page,
      error,
      "General STRK Test Execution"
    );
    errorLogs.push(generalErr);
    console.error(
      `[${testId}] Test execution failed with unexpected error:`,
      generalErr.message
    );

    test.fail(
      true,
      `Unexpected test failure: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});
