// =====================================
// 型定義のテスト
// 仕様設計問題分析_改善指示書.md に基づくテスト実装
// =====================================

import {
  Product,
  PresetProduct,
  PickupSchedule,
  FormConfigResponse,
  isProduct,
  isPresetProduct,
  isPickupSchedule,
  isFormConfigResponse,
  parseProduct,
  parsePresetProduct,
  parsePickupSchedule,
  parseFormConfigResponse,
  PresetNotFoundError,
  InvalidProductDataError,
  InvalidPresetIdError,
  InvalidApiResponseError
} from '@/types/simplified';

describe('Type Guards', () => {
  describe('isProduct', () => {
    it('should return true for valid product', () => {
      const validProduct: Product = {
        id: 1,
        name: 'Test Product',
        category_id: 1,
        price: 1000,
        visible: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      expect(isProduct(validProduct)).toBe(true);
    });

    it('should return false for invalid product', () => {
      const invalidProduct = {
        id: 1,
        name: 'Test Product',
        // missing required fields
      };

      expect(isProduct(invalidProduct)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isProduct(null)).toBe(false);
      expect(isProduct(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isProduct('string')).toBe(false);
      expect(isProduct(123)).toBe(false);
      expect(isProduct([])).toBe(false);
    });
  });

  describe('isPresetProduct', () => {
    it('should return true for valid preset product', () => {
      const validProduct: Product = {
        id: 1,
        name: 'Test Product',
        category_id: 1,
        price: 1000,
        visible: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      const validPresetProduct: PresetProduct = {
        id: 1,
        preset_id: 1,
        product_id: 1,
        display_order: 0,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        product: validProduct
      };

      expect(isPresetProduct(validPresetProduct)).toBe(true);
    });

    it('should return false for preset product with invalid product', () => {
      const invalidPresetProduct = {
        id: 1,
        preset_id: 1,
        product_id: 1,
        display_order: 0,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        product: { id: 1 } // invalid product
      };

      expect(isPresetProduct(invalidPresetProduct)).toBe(false);
    });
  });

  describe('isPickupSchedule', () => {
    it('should return true for valid pickup schedule', () => {
      const validSchedule: PickupSchedule = {
        id: 1,
        preset_id: 1,
        pickup_date: '2025-01-01',
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      expect(isPickupSchedule(validSchedule)).toBe(true);
    });

    it('should return false for invalid pickup schedule', () => {
      const invalidSchedule = {
        id: 1,
        preset_id: 1,
        // missing required fields
      };

      expect(isPickupSchedule(invalidSchedule)).toBe(false);
    });
  });
});

describe('Parse Functions', () => {
  describe('parseProduct', () => {
    it('should return product for valid data', () => {
      const validProduct: Product = {
        id: 1,
        name: 'Test Product',
        category_id: 1,
        price: 1000,
        visible: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      expect(parseProduct(validProduct)).toEqual(validProduct);
    });

    it('should throw error for invalid data', () => {
      const invalidData = { id: 1 };

      expect(() => parseProduct(invalidData)).toThrow(InvalidProductDataError);
    });
  });

  describe('parseFormConfigResponse', () => {
    it('should return form config for valid data', () => {
      const validProduct: Product = {
        id: 1,
        name: 'Test Product',
        category_id: 1,
        price: 1000,
        visible: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      const validFormConfig: FormConfigResponse = {
        preset: {
          id: 1,
          name: 'Test Preset',
          description: 'Test Description',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        form_settings: {
          id: 1,
          preset_id: 1,
          show_price: true,
          require_phone: true,
          require_furigana: false,
          allow_note: true,
          is_enabled: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        preset_products: [{
          id: 1,
          preset_id: 1,
          product_id: 1,
          display_order: 0,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          product: validProduct
        }],
        pickup_schedules: [{
          id: 1,
          preset_id: 1,
          pickup_date: '2025-01-01',
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }]
      };

      expect(parseFormConfigResponse(validFormConfig)).toEqual(validFormConfig);
    });

    it('should throw error for invalid data', () => {
      const invalidData = { preset: null };

      expect(() => parseFormConfigResponse(invalidData)).toThrow(InvalidApiResponseError);
    });
  });
});

describe('Custom Error Classes', () => {
  describe('PresetNotFoundError', () => {
    it('should create error with correct message', () => {
      const error = new PresetNotFoundError(123);
      expect(error.message).toBe('Preset not found: 123');
      expect(error.name).toBe('PresetNotFoundError');
    });
  });

  describe('InvalidProductDataError', () => {
    it('should create error with correct message', () => {
      const data = { invalid: 'data' };
      const error = new InvalidProductDataError(data);
      expect(error.message).toBe(`Invalid product data: ${JSON.stringify(data)}`);
      expect(error.name).toBe('InvalidProductDataError');
    });
  });

  describe('InvalidPresetIdError', () => {
    it('should create error with correct message', () => {
      const error = new InvalidPresetIdError('invalid-id');
      expect(error.message).toBe('Invalid preset ID: invalid-id');
      expect(error.name).toBe('InvalidPresetIdError');
    });
  });

  describe('InvalidApiResponseError', () => {
    it('should create error with correct message', () => {
      const data = { invalid: 'response' };
      const error = new InvalidApiResponseError(data);
      expect(error.message).toBe(`Invalid API response: ${JSON.stringify(data)}`);
      expect(error.name).toBe('InvalidApiResponseError');
    });
  });
});