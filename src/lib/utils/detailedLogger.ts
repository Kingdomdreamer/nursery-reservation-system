/**
 * 詳細ログシステム - 設計書に従った実装
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2, 
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${levelName}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data);
        break;
    }

    // 本番環境では外部ログサービスに送信
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.WARN) {
      this.sendToExternalService(level, message, data);
    }
  }

  private async sendToExternalService(level: LogLevel, message: string, data?: any) {
    // 外部ログサービスへの送信実装
    // 例: Sentry, LogRocket, DataDog など
    try {
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     level: LogLevel[level],
      //     message,
      //     data,
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent,
      //     url: window.location.href
      //   })
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * API呼び出しの詳細ログ
   */
  apiCall(endpoint: string, method: string, status: number, responseTime: number, data?: any) {
    const logData = {
      endpoint,
      method,
      status,
      responseTime: `${responseTime}ms`,
      ...data
    };

    if (status >= 400) {
      this.error(`API Error: ${method} ${endpoint}`, logData);
    } else if (status >= 300) {
      this.warn(`API Redirect: ${method} ${endpoint}`, logData);
    } else {
      this.info(`API Success: ${method} ${endpoint}`, logData);
    }
  }

  /**
   * ユーザーアクションのログ
   */
  userAction(action: string, context?: any) {
    this.info(`User Action: ${action}`, {
      action,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    });
  }

  /**
   * パフォーマンス測定ログ
   */
  performance(operation: string, duration: number, context?: any) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (duration > 3000) {
      this.warn(`Slow Performance: ${operation}`, logData);
    } else if (duration > 1000) {
      this.info(`Performance: ${operation}`, logData);
    } else {
      this.debug(`Performance: ${operation}`, logData);
    }
  }

  /**
   * エラー境界からのエラーログ
   */
  errorBoundary(error: Error, errorInfo: any, component?: string) {
    this.error(`Error Boundary: ${component || 'Unknown Component'}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      component,
      timestamp: new Date().toISOString()
    });
  }
}

// シングルトンインスタンス
export const detailedLogger = Logger.getInstance();

// 便利な関数エクスポート
export const logApiCall = (endpoint: string, method: string, status: number, responseTime: number, data?: any) => 
  detailedLogger.apiCall(endpoint, method, status, responseTime, data);

export const logUserAction = (action: string, context?: any) =>
  detailedLogger.userAction(action, context);

export const logPerformance = (operation: string, duration: number, context?: any) =>
  detailedLogger.performance(operation, duration, context);

export const logError = (message: string, data?: any) =>
  detailedLogger.error(message, data);

export const logDebug = (message: string, data?: any) =>
  detailedLogger.debug(message, data);