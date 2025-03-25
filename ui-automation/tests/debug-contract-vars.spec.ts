import { test } from "@playwright/test";
import { navigateAndWait } from "./utils/navigate";
import { HomePage } from "./pages/HomePage";
import { endpoint } from "./configTypes";
import { VarsDebugPage } from "./pages/VarsDebugPage";

const BURNER_WALLET_SHORT = "0x64b4...5691";
const SET_U256_FELT_WITH_KEY = "u256_felt256_key";
const SET_U256_FELT_WITH_VALUE = "42";

const SET_FELT_WITH_KEY = "0x123";
const SET_FELT_VALUE = "0x456";

const SET_BYTE_ARRAY_KEY = "byte_array";
const SET_BYTE_ARRAY_VALUE = "Hello Starknet";

const SET_CONTRACT_ADDRESS_KEY = "contract_address";
const SET_CONTRACT_ADDRESS_VALUE =
  "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";

const SET_BOOL_KEY = "bool_key";
const SET_BOOL_VALUE = "true";

test("Vars Debug Page Interaction Flow", async ({ page }) => {
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

  const varsDebugPage = new VarsDebugPage(page);

  await varsDebugPage.switchToVarsTab();
  await page.waitForTimeout(1000);

  const testResults = [];

  // Test Felt252
  const felt252Result = await varsDebugPage.testFelt252(
    SET_U256_FELT_WITH_KEY,
    SET_U256_FELT_WITH_VALUE
  );
  console.log("Felt252 test result:", felt252Result);
  testResults.push({
    name: "Felt252",
    success: felt252Result.success,
    details: felt252Result
  });

  // Test Felt
  const feltResult = await varsDebugPage.testFelt(
    SET_FELT_WITH_KEY,
    SET_FELT_VALUE
  );
  console.log("Felt test result:", feltResult);
  testResults.push({
    name: "Felt",
    success: feltResult.success,
    details: feltResult
  });

  // Test ByteArray
  const byteArrayResult = await varsDebugPage.testByteArray(
    SET_BYTE_ARRAY_KEY,
    SET_BYTE_ARRAY_VALUE
  );
  console.log("ByteArray test result:", byteArrayResult);
  testResults.push({
    name: "ByteArray",
    success: byteArrayResult.success,
    details: byteArrayResult
  });

  // Test ContractAddress
  const contractAddressResult = await varsDebugPage.testContractAddress(
    SET_CONTRACT_ADDRESS_KEY,
    SET_CONTRACT_ADDRESS_VALUE
  );
  console.log("ContractAddress test result:", contractAddressResult);
  testResults.push({
    name: "ContractAddress",
    success: contractAddressResult.success,
    details: contractAddressResult
  });

  // Test Bool
  const boolResult = await varsDebugPage.testBool(
    SET_BOOL_KEY,
    SET_BOOL_VALUE
  );
  console.log("Bool test result:", boolResult);
  testResults.push({
    name: "Bool",
    success: boolResult.success,
    details: boolResult
  });

  const failedTests = testResults.filter(test => !test.success);
  
  if (failedTests.length > 0) {
    const failedTestNames = failedTests.map(test => test.name).join(", ");
    const errorMessage = `Failure case: ${failedTestNames}`;
    
    const details = failedTests.map(test => 
      `${test.name}: ${JSON.stringify(test.details)}`
    ).join("\n");
    
    console.error(`${errorMessage}\n${details}`);
    test.fail(true, errorMessage);
  }
});