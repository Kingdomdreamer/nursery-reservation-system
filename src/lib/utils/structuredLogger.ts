// =====================================
// 構造化ログシステム
// 仕様設計問題分析_改善指示書.md に基づく監視・ログ改善
// =====================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  presetId?: number;
  productId?: number;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/**
 * 構造化ログシステム
 * 一貫性のあるログ出力とメトリクス収集を提供
 */
export class StructuredLogger {
  private static instance: StructuredLogger;
  private context: LogContext = {};

  private constructor() {}

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  /**
   * グローバルコンテキストの設定
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * コンテキストのクリア
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * デバッグレベルのログ
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * 情報レベルのログ
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * 警告レベルのログ
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * エラーレベルのログ
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;

    this.log('error', message, context, errorInfo);
  }

  /**
   * パフォーマンス測定付きログ
   */
  performance(
    message: string, 
    startTime: number, 
    endTime: number, 
    context?: LogContext
  ): void {
    const performance = {
      startTime,
      endTime,
      duration: endTime - startTime
    };

    this.log('info', message, context, undefined, performance);
  }

  /**
   * HTTPリクエストログ
   */
  httpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ): void {
    const httpContext = {
      method,
      url,
      statusCode,
      responseTime,
      ...context
    };

    const level = statusCode >= 400 ? 'error' : 'info';
    this.log(level, `HTTP ${method} ${url} ${statusCode} ${responseTime}ms`, httpContext);
  }

  /**
   * ビジネスロジックログ
   */
  business(
    action: string,
    result: 'success' | 'failure',
    context?: LogContext
  ): void {
    const level = result === 'failure' ? 'warn' : 'info';
    this.log(level, `Business: ${action} - ${result}`, context);
  }

  /**
   * データベースクエリログ
   */
  database(
    query: string,
    duration: number,
    affectedRows?: number,
    context?: LogContext
  ): void {
    const dbContext = {
      query: query.substring(0, 200), // 長いクエリは切り詰め
      duration,
      affectedRows,
      ...context
    };

    const level = duration > 1000 ? 'warn' : 'debug'; // 1秒以上なら警告
    this.log(level, `Database query (${duration}ms)`, dbContext);
  }

  /**
   * セキュリティイベントログ
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high',
    context?: LogContext
  ): void {
    const securityContext = {
      securityEvent: event,
      severity,
      ...context
    };

    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    this.log(level, `Security: ${event}`, securityContext);
  }

  /**
   * 内部ログ出力メソッド
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: { name: string; message: string; stack?: string },
    performance?: { startTime: number; endTime: number; duration: number }
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      error,
      performance
    };

    // 開発環境では見やすい形式で出力
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(logEntry);
    } else {
      // 本番環境では構造化JSON形式で出力
      console.log(JSON.stringify(logEntry));
    }

    // 外部ログサービスへの送信（将来の拡張用）
    this.sendToExternalService(logEntry);
  }

  /**
   * 開発環境用のコンソール出力
   */
  private consoleLog(entry: LogEntry): void {
    const { timestamp, level, message, context, error, performance } = entry;
    
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    const contextStr = context && Object.keys(context).length > 0 
      ? `\n  Context: ${JSON.stringify(context, null, 2)}`
      : '';
    const errorStr = error 
      ? `\n  Error: ${error.name}: ${error.message}${error.stack ? '\n  Stack: ' + error.stack : ''}`
      : '';
    const perfStr = performance 
      ? `\n  Performance: ${performance.duration}ms`
      : '';

    const fullMessage = `${prefix} ${message}${contextStr}${errorStr}${perfStr}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
    }
  }

  /**
   * 外部ログサービスへの送信
   * 実装例：Datadog、CloudWatch、Sentry等
   */
  private sendToExternalService(entry: LogEntry): void {
    // 将来的にはここで外部サービスにログを送信
    // 例：
    // if (process.env.DATADOG_API_KEY) {
    //   sendToDatadog(entry);
    // }
    // if (process.env.CLOUDWATCH_LOG_GROUP) {
    //   sendToCloudWatch(entry);
    // }
  }
}

// シングルトンインスタンスのエクスポート
export const logger = StructuredLogger.getInstance();

/**
 * パフォーマンス測定デコレータ
 */
export function logPerformance(message?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const logMessage = message || `${target.constructor.name}.${propertyName}`;
      
      try {
        const result = await method.apply(this, args);
        const endTime = Date.now();
        
        logger.performance(logMessage, startTime, endTime, {
          args: args.length,
          success: true
        });
        
        return result;
      } catch (error) {
        const endTime = Date.now();
        
        logger.performance(logMessage, startTime, endTime, {
          args: args.length,
          success: false
        });
        
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * メトリクス収集クラス
 */
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * カウンタの増加
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const currentValue = this.metrics.get(key) || 0;
    this.metrics.set(key, currentValue + value);
    
    logger.debug(`Metric incremented: ${key} = ${currentValue + value}`);
  }

  /**
   * ゲージの設定
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    this.metrics.set(key, value);
    
    logger.debug(`Metric gauge set: ${key} = ${value}`);
  }

  /**
   * メトリクスの取得
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * メトリクスのクリア
   */
  clear(): void {
    this.metrics.clear();
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }
}

export const metrics = MetricsCollector.getInstance();