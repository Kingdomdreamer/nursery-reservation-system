/**
 * APIエラーハンドラーのテスト
 * 統一エラーレスポンス生成の動作確認
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  handleApiError,
  createSuccessResponse,
  createValidationError,
  createAuthError,
  createAuthorizationError,
  ApiErrorResponse,
  ApiSuccessResponse
} from '@/lib/utils/apiErrorHandler';
import {
  ValidationError,
  AuthenticationError,
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
  RateLimitError
} from '@/lib/utils/customErrors';

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: jest.fn(() => Promise.resolve(data)),
      status: options?.status || 200,
      data
    }))
  }
}));

describe('ApiErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Invalid email format', 'email');
      const response = handleApiError(error, 'test-context');

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid email format',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          field: 'email'
        }),
        { status: 400 }
      );
    });

    it('should handle AuthenticationError correctly', () => {
      const error = new AuthenticationError('Login required');
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Login required',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.'
        }),
        { status: 401 }
      );
    });

    it('should handle DatabaseError correctly', () => {
      const error = new DatabaseError('Connection failed');
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Connection failed',
          code: 'DATABASE_ERROR',
          message: 'Database error occurred.'
        }),
        { status: 500 }
      );
    });

    it('should handle RateLimitError with retryAfter', () => {
      const error = new RateLimitError('Too many requests', 60);
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded.',
          retryAfter: 60
        }),
        { status: 429 }
      );
    });

    it('should handle Supabase errors as DatabaseError', () => {
      const supabaseError = {
        message: 'relation "users" does not exist',
        code: 'PGRST116'
      };
      
      const response = handleApiError(supabaseError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'データベースエラーが発生しました',
          code: 'DATABASE_ERROR',
          message: 'Database error occurred.'
        }),
        { status: 500 }
      );
    });

    it('should handle network errors as ExternalServiceError', () => {
      const networkError = new Error('fetch failed due to network timeout');
      const response = handleApiError(networkError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ネットワークエラーが発生しました',
          code: 'EXTERNAL_SERVICE_ERROR',
          message: 'External service error.'
        }),
        { status: 502 }
      );
    });

    it('should handle unexpected errors', () => {
      const unexpectedError = new Error('Something went wrong');
      const response = handleApiError(unexpectedError);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: '予期しないエラーが発生しました',
          code: 'UNEXPECTED_ERROR',
          message: 'Unexpected error occurred.'
        }),
        { status: 500 }
      );
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ValidationError('Test error');
      error.stack = 'Error stack trace...';
      
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Error stack trace...'
        }),
        { status: 400 }
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new ValidationError('Test error');
      error.stack = 'Error stack trace...';
      
      const response = handleApiError(error);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log critical errors differently than operational errors', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      // Operational error
      const operationalError = new ValidationError('Invalid input');
      handleApiError(operationalError);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ OPERATIONAL ERROR:',
        expect.any(Object)
      );

      // Non-operational error
      const criticalError = new Error('System failure');
      handleApiError(criticalError);
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 CRITICAL ERROR:',
        expect.any(Object)
      );
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should create success response with data and meta', () => {
      const data = { id: 1, name: 'Test' };
      const meta = { total: 10, page: 1 };
      const response = createSuccessResponse(data, meta);

      expect(NextResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          total: 10,
          page: 1
        })
      });
    });
  });

  describe('createValidationError', () => {
    it('should create validation error response', () => {
      const response = createValidationError('Invalid input', 'email');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          field: 'email'
        },
        { status: 400 }
      );
    });

    it('should create validation error response without field', () => {
      const response = createValidationError('Invalid input');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          field: undefined
        },
        { status: 400 }
      );
    });
  });

  describe('createAuthError', () => {
    it('should create authentication error with default message', () => {
      const response = createAuthError();

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: '認証が必要です',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.'
        },
        { status: 401 }
      );
    });

    it('should create authentication error with custom message', () => {
      const response = createAuthError('Invalid credentials');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Invalid credentials',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required.'
        },
        { status: 401 }
      );
    });
  });

  describe('createAuthorizationError', () => {
    it('should create authorization error with default message', () => {
      const response = createAuthorizationError();

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'アクセス権限がありません',
          code: 'AUTHORIZATION_FAILED',
          message: 'Access denied.'
        },
        { status: 403 }
      );
    });

    it('should create authorization error with custom message', () => {
      const response = createAuthorizationError('Insufficient permissions');

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: 'Insufficient permissions',
          code: 'AUTHORIZATION_FAILED',
          message: 'Access denied.'
        },
        { status: 403 }
      );
    });
  });

  describe('Error Response Type Safety', () => {
    it('should match ApiErrorResponse interface', () => {
      const error = new ValidationError('Test error', 'field');
      handleApiError(error);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      
      // Check required properties
      expect(callArgs).toHaveProperty('error');
      expect(callArgs).toHaveProperty('code');
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('timestamp');

      // Check types
      expect(typeof callArgs.error).toBe('string');
      expect(typeof callArgs.code).toBe('string');
      expect(typeof callArgs.message).toBe('string');
      expect(typeof callArgs.timestamp).toBe('string');
    });

    it('should match ApiSuccessResponse interface', () => {
      const data = { test: 'data' };
      createSuccessResponse(data);

      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
      
      // Check required properties
      expect(callArgs).toHaveProperty('success', true);
      expect(callArgs).toHaveProperty('data');
      expect(callArgs).toHaveProperty('meta');
      expect(callArgs.meta).toHaveProperty('timestamp');

      // Check types
      expect(typeof callArgs.success).toBe('boolean');
      expect(callArgs.data).toEqual(data);
      expect(typeof callArgs.meta.timestamp).toBe('string');
    });
  });

  describe('Context Logging', () => {
    it('should include context in error logs', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      const error = new ValidationError('Test error');
      
      handleApiError(error, 'user-registration');

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ OPERATIONAL ERROR:',
        expect.objectContaining({
          context: 'user-registration'
        })
      );
    });

    it('should use "unknown" as default context', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      const error = new ValidationError('Test error');
      
      handleApiError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ OPERATIONAL ERROR:',
        expect.objectContaining({
          context: 'unknown'
        })
      );
    });
  });
});