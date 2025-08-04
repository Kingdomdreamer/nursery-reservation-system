/**
 * Application logging utilities
 * Provides consistent logging across the application with environment-appropriate output
 */

export interface LogContext {
  userId?: string;
  presetId?: number;
  apiEndpoint?: string;
  duration?: number;
  statusCode?: number;
  error?: unknown;
  [key: string]: unknown;
}

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

/**
 * Main logger class
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Send logs to external service in production
   */
  private async sendToExternalService(level: LogLevel, message: string, context?: LogContext) {
    // In production, you would send to services like Sentry, LogRocket, etc.
    if (!this.isDevelopment && this.isClient) {
      // Example: Send to external logging service
      try {
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ level, message, context, timestamp: new Date().toISOString() })
        // });
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    console.log(formattedMessage);
    this.sendToExternalService(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formattedMessage);
    this.sendToExternalService(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : error
    };

    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, errorContext);
    console.error(formattedMessage);
    this.sendToExternalService(LogLevel.ERROR, message, errorContext);
  }

  /**
   * API specific logging
   */
  api(endpoint: string, statusCode: number, duration: number, context?: LogContext) {
    const apiContext: LogContext = {
      ...context,
      apiEndpoint: endpoint,
      statusCode,
      duration
    };

    const message = `API ${endpoint} - ${statusCode} (${duration}ms)`;
    
    if (statusCode >= 400) {
      this.error(message, undefined, apiContext);
    } else if (statusCode >= 300) {
      this.warn(message, apiContext);
    } else {
      this.info(message, apiContext);
    }
  }

  /**
   * User action logging
   */
  userAction(action: string, userId?: string, context?: LogContext) {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      actionType: 'user_action'
    });
  }

  /**
   * Performance logging
   */
  performance(operation: string, duration: number, context?: LogContext) {
    const perfContext: LogContext = {
      ...context,
      operation,
      duration,
      performanceType: 'timing'
    };

    if (duration > 3000) {
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, perfContext);
    } else {
      this.debug(`Performance: ${operation} completed in ${duration}ms`, perfContext);
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Performance measurement helper
 */
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.performance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`Operation failed: ${operation}`, error, {
      ...context,
      duration,
      operationType: 'failed'
    });
    throw error;
  }
};

/**
 * API call wrapper with automatic logging
 */
export const loggedFetch = async (
  endpoint: string,
  options?: RequestInit,
  context?: LogContext
): Promise<Response> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(endpoint, options);
    const duration = performance.now() - startTime;
    
    logger.api(endpoint, response.status, duration, {
      ...context,
      method: options?.method || 'GET'
    });
    
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`API call failed: ${endpoint}`, error, {
      ...context,
      apiEndpoint: endpoint,
      duration,
      method: options?.method || 'GET'
    });
    throw error;
  }
};