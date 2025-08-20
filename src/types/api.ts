/**
 * 統一API型定義
 * 全てのAPIエンドポイントで使用する共通型
 */

// 基本APIレスポンス型
export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
}

// 成功レスポンス型
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
    has_next?: boolean;
    has_previous?: boolean;
    [key: string]: unknown;
  };
}

// エラーレスポンス型
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  code?: string;
  message?: string;
  details?: string;
  field?: string;
  stack?: string; // 開発環境のみ
}

// API レスポンスの統合型
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ページネーション情報型
export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ページネーション付きレスポンス型
export interface PaginatedApiResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationInfo;
}

// CSVインポート結果型
export interface ImportResult {
  success: number;
  total: number;
  errors: ImportError[];
  warnings: string[];
  insertedProducts?: unknown[];
}

export interface ImportError {
  row?: number;
  field?: string;
  message: string;
  data?: unknown;
  details?: string;
}

// バリデーションエラー詳細型
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// バッチ操作結果型
export interface BatchOperationResult {
  success: number;
  failed: number;
  total: number;
  errors: Array<{
    id: string | number;
    error: string;
  }>;
}

// 型ガード関数
export const isApiSuccessResponse = <T>(response: unknown): response is ApiSuccessResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiSuccessResponse<T>).success === true &&
    'data' in response
  );
};

export const isApiErrorResponse = (response: unknown): response is ApiErrorResponse => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiErrorResponse).success === false &&
    'error' in response
  );
};

export const isPaginatedResponse = <T>(response: unknown): response is PaginatedApiResponse<T> => {
  return (
    isApiSuccessResponse(response) &&
    'pagination' in response &&
    Array.isArray((response as PaginatedApiResponse<T>).data)
  );
};

// APIクライアント用のヘルパー関数
export const createSuccessResponse = <T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta']
): ApiSuccessResponse<T> => ({
  success: true,
  data,
  meta,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (
  error: string,
  options?: {
    code?: string;
    message?: string;
    details?: string;
    field?: string;
  }
): ApiErrorResponse => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
  ...options
});

export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationInfo,
  meta?: Record<string, unknown>
): PaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination,
  meta: {
    ...meta,
    total: pagination.totalItems
  },
  timestamp: new Date().toISOString()
});

// APIエラークラス
export class ApiError extends Error {
  public readonly code?: string;
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly field?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    options?: {
      code?: string;
      details?: string;
      field?: string;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.field = options?.field;
  }

  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
      field: this.field,
      timestamp: new Date().toISOString()
    };
  }
}