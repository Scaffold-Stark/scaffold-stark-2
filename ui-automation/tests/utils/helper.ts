import { Page } from "playwright";
import { captureError, TestError } from "./error-handler";

export async function withDelay<T>(
  page: Page, 
  action: () => Promise<T> | T, 
  delayMs = 2000,
  context = "delayed action"
): Promise<T> {
  try {
    await page.waitForTimeout(delayMs);
    return await action();
  } catch (error) {
    const testError = await captureError(page, error, context);
    console.error(`Action failed after delay of ${delayMs}ms:`, testError.message);
    throw error;
  }
}

export async function withDelaySequence<T>(
  page: Page, 
  actions: Array<() => Promise<any> | any>, 
  delayMs = 1000,
  contexts: string[] = []
): Promise<T> {
  let result: any;
  const errors: TestError[] = [];
  
  for (let i = 0; i < actions.length; i++) {
    const actionContext = contexts[i] || `action_${i+1}`;
    
    try {
      await page.waitForTimeout(delayMs);
      result = await actions[i]();
    } catch (error) {
      const testError = await captureError(
        page, 
        error, 
        `Action ${i+1}/${actions.length} (${actionContext})`
      );
      
      errors.push(testError);
      console.error(`Action ${i+1}/${actions.length} failed in sequence:`, testError.message);
      throw error;
    }
  }
  
  return result as T;
}

export async function withRetry<T>(
  page: Page,
  action: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
  context = "retried action"
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        await page.waitForTimeout(delayMs);
        console.log(`Retry attempt ${attempt}/${maxAttempts} for ${context}`);
      }
      
      return await action();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed for ${context}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const finalError = await captureError(
    page, 
    lastError, 
    `Failed after ${maxAttempts} attempts: ${context}`
  );
  
  console.error(`All ${maxAttempts} attempts failed for ${context}:`, finalError.message);
  throw lastError;
}