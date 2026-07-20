/**
 * Try-Catch utility helpers for cleaner error handling without verbose try-catch blocks.
 */

/**
 * Execute an operation with synchronous error handling.
 * @param operation - function to execute
 * @param onError - optional error callback
 */
export function tryCatch(operation: () => void, onError?: (error: unknown) => void): void {
  try {
    operation();
  } catch (error) {
    onError?.(error);
  }
}

/**
 * Execute an operation and return a result, with synchronous error handling.
 * @param operation - function that returns a value
 * @param defaultValue - value to return if operation throws
 * @param onError - optional error callback
 */
export function tryCatchWithReturn<T>(operation: () => T, defaultValue: T, onError?: (error: unknown) => void): T {
  try {
    return operation();
  } catch (error) {
    onError?.(error);
    return defaultValue;
  }
}
