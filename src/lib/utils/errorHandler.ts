// Centralized error handling system

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL = 'INTERNAL',
  LINE_API = 'LINE_API',
}

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: Record<string, unknown>;
  userMessage?: string;
  originalError?: Error;
}

export class CustomError extends Error implements AppError {
  type: ErrorType;
  code?: string;
  details?: Record<string, unknown>;
  userMessage?: string;
  originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
      userMessage?: string;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = type;
    this.code = options?.code;
    this.details = options?.details;
    this.userMessage = options?.userMessage;
    this.originalError = options?.originalError;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

// Specific error classes
export class ValidationError extends CustomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorType.VALIDATION, {
      details,
      userMessage: '入力内容に誤りがあります。確認してください。',
    });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends CustomError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorType.NETWORK, {
      originalError,
      userMessage: 'ネットワークエラーが発生しました。接続を確認してください。',
    });
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, code?: string, originalError?: Error) {
    super(message, ErrorType.DATABASE, {
      code,
      originalError,
      userMessage: 'データベースエラーが発生しました。しばらく後に再試行してください。',
    });
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, ErrorType.AUTHENTICATION, {
      userMessage: 'ログインが必要です。再度ログインしてください。',
    });
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends CustomError {
  constructor(message: string = 'Permission denied') {
    super(message, ErrorType.PERMISSION, {
      userMessage: 'この操作を行う権限がありません。',
    });
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ErrorType.NOT_FOUND, {
      userMessage: '指定された情報が見つかりません。',
    });
    this.name = 'NotFoundError';
  }
}

export class LineApiError extends CustomError {
  constructor(message: string, code?: string, originalError?: Error) {
    super(message, ErrorType.LINE_API, {
      code,
      originalError,
      userMessage: 'LINE連携でエラーが発生しました。',
    });
    this.name = 'LineApiError';
  }
}

// Error handling utilities
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof Error && 'type' in error;
};

export const createError = (
  message: string,
  type: ErrorType = ErrorType.INTERNAL,
  options?: {
    code?: string;
    details?: Record<string, unknown>;
    userMessage?: string;
    originalError?: Error;
  }
): AppError => {
  return new CustomError(message, type, options);
};

// Error categorization from unknown errors
export const categorizeError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof TypeError) {
    return new ValidationError(error.message, { originalError: error });
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message, error);
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return new AuthenticationError(error.message);
    }
    
    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return new PermissionError(error.message);
    }
    
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return new NotFoundError('リソース');
    }

    return new CustomError(error.message, ErrorType.INTERNAL, { originalError: error });
  }

  return new CustomError('Unknown error occurred', ErrorType.INTERNAL, {
    details: { originalError: error },
  });
};

// Error logging
export interface ErrorLogger {
  log: (error: AppError, context?: Record<string, unknown>) => void;
  logToConsole: (error: AppError, context?: Record<string, unknown>) => void;
  logToService?: (error: AppError, context?: Record<string, unknown>) => Promise<void>;
}

export class DefaultErrorLogger implements ErrorLogger {
  log(error: AppError, context?: Record<string, unknown>): void {
    this.logToConsole(error, context);
    
    // In production, you might want to send to an external service
    if (process.env.NODE_ENV === 'production' && this.logToService) {
      this.logToService(error, context).catch((serviceError) => {
        console.error('Failed to log error to service:', serviceError);
      });
    }
  }

  logToConsole(error: AppError, context?: Record<string, unknown>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      type: error.type,
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      userMessage: error.userMessage,
      stack: error.stack,
      context,
    };

    switch (error.type) {
      case ErrorType.VALIDATION:
        console.warn('[VALIDATION ERROR]', logData);
        break;
      case ErrorType.NETWORK:
        console.error('[NETWORK ERROR]', logData);
        break;
      case ErrorType.DATABASE:
        console.error('[DATABASE ERROR]', logData);
        break;
      case ErrorType.AUTHENTICATION:
        console.warn('[AUTH ERROR]', logData);
        break;
      case ErrorType.PERMISSION:
        console.warn('[PERMISSION ERROR]', logData);
        break;
      case ErrorType.NOT_FOUND:
        console.warn('[NOT FOUND ERROR]', logData);
        break;
      case ErrorType.LINE_API:
        console.error('[LINE API ERROR]', logData);
        break;
      default:
        console.error('[INTERNAL ERROR]', logData);
    }
  }

  async logToService(error: AppError, context?: Record<string, unknown>): Promise<void> {
    // Implementation would depend on your logging service (e.g., Sentry, LogRocket, etc.)
    // For now, this is a placeholder
    try {
      // Example: await sendToLoggingService(error, context);
    } catch (serviceError) {
      console.error('Logging service error:', serviceError);
    }
  }
}

// Global error logger instance
export const errorLogger = new DefaultErrorLogger();

// Error handling wrapper for async functions
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, unknown>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = categorizeError(error);
      errorLogger.log(appError, { ...context, functionName: fn.name });
      throw appError;
    }
  };
};

// Error boundary helper for components
export const withComponentErrorHandling = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: AppError; retry?: () => void }>
) => {
  const WrappedComponent: React.ComponentType<P> = (props) => {
    const [error, setError] = React.useState<AppError | null>(null);

    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        const appError = categorizeError(event.error);
        setError(appError);
        errorLogger.log(appError, { component: Component.name });
      };

      const handlePromiseRejection = (event: PromiseRejectionEvent) => {
        const appError = categorizeError(event.reason);
        setError(appError);
        errorLogger.log(appError, { component: Component.name });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handlePromiseRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handlePromiseRejection);
      };
    }, []);

    if (error) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent error={error} retry={() => setError(null)} />;
      }
      
      return (
        <div className="error-boundary p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">エラーが発生しました</h2>
          <p className="text-red-600 mb-4">{error.userMessage || error.message}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
};