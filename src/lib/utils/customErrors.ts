/**
 * カスタムエラークラス群
 * 統一されたエラー処理のための専用エラークラス
 */

// ベースエラークラス
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // プロトタイプチェーンを正しく設定
    Object.setPrototypeOf(this, new.target.prototype);
    
    // スタックトレースをキャプチャ
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.constructor.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

// 400番台エラー（クライアントエラー）
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 'AUTHENTICATION_REQUIRED', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'アクセス権限がありません') {
    super(message, 'AUTHORIZATION_FAILED', 403);
  }
}

export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string, resource?: string) {
    super(message, 'RESOURCE_NOT_FOUND', 404);
    this.resource = resource;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'RESOURCE_CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'レート制限に達しました', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.retryAfter = retryAfter;
  }
}

// 500番台エラー（サーバーエラー）
export class DatabaseError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
    this.originalError = originalError;
  }
}

export class ExternalServiceError extends AppError {
  public readonly service?: string;

  constructor(message: string, service?: string) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502);
    this.service = service;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, false); // 運用上のエラー
  }
}

// 予約システム固有のエラー
export class ReservationError extends AppError {
  public readonly reservationId?: string;

  constructor(message: string, reservationId?: string) {
    super(message, 'RESERVATION_ERROR', 400);
    this.reservationId = reservationId;
  }
}

export class PresetError extends AppError {
  public readonly presetId?: number;

  constructor(message: string, presetId?: number) {
    super(message, 'PRESET_ERROR', 400);
    this.presetId = presetId;
  }
}

export class ProductError extends AppError {
  public readonly productId?: number;

  constructor(message: string, productId?: number) {
    super(message, 'PRODUCT_ERROR', 400);
    this.productId = productId;
  }
}

export class LineMessagingError extends AppError {
  public readonly userId?: string;

  constructor(message: string, userId?: string) {
    super(message, 'LINE_MESSAGING_ERROR', 502);
    this.userId = userId;
  }
}

// エラー判定ヘルパー関数
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const isOperationalError = (error: unknown): boolean => {
  return isAppError(error) && error.isOperational;
};

// エラーファクトリー関数
export const createValidationError = (message: string, field?: string): ValidationError => {
  return new ValidationError(message, field);
};

export const createNotFoundError = (resource: string, id?: string | number): NotFoundError => {
  const message = id 
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return new NotFoundError(message, resource);
};

export const createDatabaseError = (operation: string, originalError?: Error): DatabaseError => {
  const message = `Database operation failed: ${operation}`;
  return new DatabaseError(message, originalError);
};

export const createExternalServiceError = (service: string, operation: string): ExternalServiceError => {
  const message = `${service} service error during ${operation}`;
  return new ExternalServiceError(message, service);
};

// エラーコード列挙
export const ErrorCodes = {
  // 400番台
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 500番台
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  
  // アプリ固有
  RESERVATION_ERROR: 'RESERVATION_ERROR',
  PRESET_ERROR: 'PRESET_ERROR',
  PRODUCT_ERROR: 'PRODUCT_ERROR',
  LINE_MESSAGING_ERROR: 'LINE_MESSAGING_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];