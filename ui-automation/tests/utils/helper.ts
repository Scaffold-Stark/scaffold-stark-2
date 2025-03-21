import { Page } from "playwright";

/**
 * Executes an action with a delay before execution
 * @param page Playwright Page object
 * @param action The function to execute after the delay
 * @param delayMs The delay in milliseconds (default: 2000ms)
 * @returns The result of the action
 */
export async function withDelay<T>(page: Page, action: () => Promise<T> | T, delayMs = 2000): Promise<T> {
  await page.waitForTimeout(delayMs);
  return await action();
}

/**
 * Executes a sequence of actions with delays between them
 * @param page Playwright Page object
 * @param actions Array of functions to execute in sequence
 * @param delayMs The delay in milliseconds between actions (default: 2000ms)
 * @returns The result of the last action
 */
export async function withDelaySequence<T>(
  page: Page, 
  actions: Array<() => Promise<any> | any>, 
  delayMs = 1000
): Promise<T> {
  let result: any;
  
  for (const action of actions) {
    await page.waitForTimeout(delayMs);
    result = await action();
  }
  
  return result as T;
}