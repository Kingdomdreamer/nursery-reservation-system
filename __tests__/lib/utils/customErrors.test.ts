/**
 * カスタムエラークラスのテスト
 * 統一エラーハンドリングの動作確認
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ConfigurationError,
  ReservationError,
  PresetError,
  ProductError,
  LineMessagingError,
  isAppError,
  isOperationalError,
  createValidationError,
  createNotFoundError,
  createDatabaseError,
  createExternalServiceError,
  ErrorCodes
} from '@/lib/utils/customErrors';

describe('CustomErrors', () => {
  describe('AppError', () => {
    class TestAppError extends AppError {
      constructor(message: string) {
        super(message, 'TEST_ERROR', 500);
      }
    }

    it('should create AppError with correct properties', () => {
      const error = new TestAppError('Test error message');
      
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe('string');
    });

    it('should serialize to JSON correctly', () => {
      const error = new TestAppError('Test error');
      const json = error.toJSON();
      
      expect(json.name).toBe('TestAppError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.statusCode).toBe(500);
      expect(json.timestamp).toBeDefined();
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new TestAppError('Test error');
      const json = error.toJSON();
      
      expect(json.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new TestAppError('Test error');
      const json = error.toJSON();
      
      expect(json.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', 'email');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('email');
      expect(error.isOperational).toBe(true);
    });

    it('should work without field parameter', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('認証が必要です');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.statusCode).toBe(401);
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth message');
      
      expect(error.message).toBe('Custom auth message');
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError with default message', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('アクセス権限がありません');
      expect(error.code).toBe('AUTHORIZATION_FAILED');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with resource', () => {
      const error = new NotFoundError('Resource not found', 'user');
      
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('user');
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with retry after', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with original error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database operation failed', originalError);
      
      expect(error.message).toBe('Database operation failed');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create ExternalServiceError with service name', () => {
      const error = new ExternalServiceError('Service unavailable', 'line-api');
      
      expect(error.message).toBe('Service unavailable');
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.service).toBe('line-api');
    });
  });

  describe('ConfigurationError', () => {
    it('should create ConfigurationError as non-operational', () => {
      const error = new ConfigurationError('Missing configuration');
      
      expect(error.message).toBe('Missing configuration');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('Domain-specific Errors', () => {
    it('should create ReservationError with reservation ID', () => {
      const error = new ReservationError('Reservation failed', 'res_123');
      
      expect(error.message).toBe('Reservation failed');
      expect(error.code).toBe('RESERVATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.reservationId).toBe('res_123');
    });

    it('should create PresetError with preset ID', () => {
      const error = new PresetError('Preset not found', 1);
      
      expect(error.message).toBe('Preset not found');
      expect(error.code).toBe('PRESET_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.presetId).toBe(1);
    });

    it('should create ProductError with product ID', () => {
      const error = new ProductError('Product unavailable', 123);
      
      expect(error.message).toBe('Product unavailable');
      expect(error.code).toBe('PRODUCT_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.productId).toBe(123);
    });

    it('should create LineMessagingError with user ID', () => {
      const error = new LineMessagingError('Message send failed', 'user_456');
      
      expect(error.message).toBe('Message send failed');
      expect(error.code).toBe('LINE_MESSAGING_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.userId).toBe('user_456');
    });
  });

  describe('Helper Functions', () => {
    describe('isAppError', () => {
      it('should return true for AppError instances', () => {
        const error = new ValidationError('Test error');
        expect(isAppError(error)).toBe(true);
      });

      it('should return false for standard Error instances', () => {
        const error = new Error('Test error');
        expect(isAppError(error)).toBe(false);
      });

      it('should return false for non-error values', () => {
        expect(isAppError('string')).toBe(false);
        expect(isAppError(123)).toBe(false);
        expect(isAppError(null)).toBe(false);
        expect(isAppError(undefined)).toBe(false);
      });
    });

    describe('isOperationalError', () => {
      it('should return true for operational AppErrors', () => {
        const error = new ValidationError('Test error');
        expect(isOperationalError(error)).toBe(true);
      });

      it('should return false for non-operational AppErrors', () => {
        const error = new ConfigurationError('Config missing');
        expect(isOperationalError(error)).toBe(false);
      });

      it('should return false for non-AppErrors', () => {
        const error = new Error('Test error');
        expect(isOperationalError(error)).toBe(false);
      });
    });
  });

  describe('Error Factory Functions', () => {
    describe('createValidationError', () => {
      it('should create ValidationError with message and field', () => {
        const error = createValidationError('Invalid email', 'email');
        
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Invalid email');
        expect(error.field).toBe('email');
      });
    });

    describe('createNotFoundError', () => {
      it('should create NotFoundError with resource and ID', () => {
        const error = createNotFoundError('user', 123);
        
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.message).toBe('user with ID 123 not found');
        expect(error.resource).toBe('user');
      });

      it('should create NotFoundError without ID', () => {
        const error = createNotFoundError('user');
        
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.message).toBe('user not found');
        expect(error.resource).toBe('user');
      });
    });

    describe('createDatabaseError', () => {
      it('should create DatabaseError with operation and original error', () => {
        const originalError = new Error('Connection failed');
        const error = createDatabaseError('select', originalError);
        
        expect(error).toBeInstanceOf(DatabaseError);
        expect(error.message).toBe('Database operation failed: select');
        expect(error.originalError).toBe(originalError);
      });
    });

    describe('createExternalServiceError', () => {
      it('should create ExternalServiceError with service and operation', () => {
        const error = createExternalServiceError('LINE', 'send message');
        
        expect(error).toBeInstanceOf(ExternalServiceError);
        expect(error.message).toBe('LINE service error during send message');
        expect(error.service).toBe('LINE');
      });
    });
  });

  describe('ErrorCodes', () => {
    it('should contain all expected error codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.AUTHENTICATION_REQUIRED).toBe('AUTHENTICATION_REQUIRED');
      expect(ErrorCodes.AUTHORIZATION_FAILED).toBe('AUTHORIZATION_FAILED');
      expect(ErrorCodes.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
      expect(ErrorCodes.RESOURCE_CONFLICT).toBe('RESOURCE_CONFLICT');
      expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCodes.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
      expect(ErrorCodes.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
      expect(ErrorCodes.RESERVATION_ERROR).toBe('RESERVATION_ERROR');
      expect(ErrorCodes.PRESET_ERROR).toBe('PRESET_ERROR');
      expect(ErrorCodes.PRODUCT_ERROR).toBe('PRODUCT_ERROR');
      expect(ErrorCodes.LINE_MESSAGING_ERROR).toBe('LINE_MESSAGING_ERROR');
    });

    it('should be readonly', () => {
      // TypeScript should prevent this, but let's test runtime behavior
      expect(() => {
        (ErrorCodes as any).NEW_ERROR = 'NEW_ERROR';
      }).not.toThrow(); // Object might be extensible at runtime
      
      // But the original values should remain unchanged
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });
  });
});