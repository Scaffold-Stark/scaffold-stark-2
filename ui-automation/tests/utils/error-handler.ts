import { Page } from "playwright";

export interface TestError {
  message: string;
  screenshot?: string;
  consoleLog?: string[];
  networkErrors?: string[];
  context: string;
  timestamp: number;
}

export interface TestResult {
  success: boolean;
  actualValue?: string;
  error?: string;
  context?: string;
  details?: any;
}

export async function captureError(page: Page, error: any, context: string): Promise<TestError> {
  const timestamp = Date.now();
  const screenshotPath = `error-${context.replace(/\s+/g, '-')}-${timestamp}.png`;
  await page.screenshot({ path: screenshotPath });
  
  let errorMessage = "Unknown error";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = JSON.stringify(error);
  }
  
  return {
    message: `${context}: ${errorMessage}`,
    screenshot: screenshotPath,
    consoleLog: [],
    networkErrors: [],
    context,
    timestamp
  };
}

export function logTestError(testName: string, error: TestError): void {
  console.error(`
=== TEST ERROR: ${testName} ===
${error.message}

${error.consoleLog && error.consoleLog.length ? 
  `CONSOLE LOG:\n${error.consoleLog.join('\n')}\n` : ''}

${error.networkErrors && error.networkErrors.length ? 
  `NETWORK ERRORS:\n${error.networkErrors.join('\n')}\n` : ''}

Screenshot saved: ${error.screenshot}
============================
  `);
}

export function formatTestResults(testResults: TestResult[]): string {
  const failedTests = testResults.filter(test => !test.success);
  
  if (failedTests.length === 0) {
    return "All tests passed successfully";
  }
  
  const testCount = testResults.length;
  const failureCount = failedTests.length;
  
  let summary = `${failureCount}/${testCount} tests failed\n\n`;
  
  failedTests.forEach((test, index) => {
    summary += `${index + 1}. Test ${test.context || 'Unknown'} failed:\n`;
    summary += `   Error: ${test.error || 'Unknown error'}\n`;
    if (test.actualValue) {
      summary += `   Actual value: ${test.actualValue}\n`;
    }
    if (test.details) {
      summary += `   Details: ${JSON.stringify(test.details)}\n`;
    }
    summary += '\n';
  });
  
  return summary;
}