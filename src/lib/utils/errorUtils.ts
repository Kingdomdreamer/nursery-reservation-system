/**
 * Error handling utilities to prevent React error #418
 */

/**
 * Safely converts any error-like value to a string for display
 * @param error - Any error value (Error object, string, or unknown)
 * @param fallback - Fallback message if error cannot be converted
 * @returns String representation of the error
 */
export function getErrorMessage(error: unknown, fallback = 'エラーが発生しました'): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object') {
    // Try to extract message from error-like objects
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    
    // For objects without a clear message, return JSON representation
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  
  return fallback;
}

/**
 * Safely renders any value as text, preventing React error #418
 * @param value - Any value that might be rendered in JSX
 * @param fallback - Fallback text if value cannot be rendered
 * @returns String representation safe for JSX
 */
export function safeRender(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  
  return String(value);
}