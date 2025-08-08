/**
 * プリセット設定API統合テスト
 * src/app/api/presets/[presetId]/config/route.ts のテスト
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/presets/[presetId]/config/route';

// Mock Supabase client
const mockSupabaseResponse = {
  data: null,
  error: null
};

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve(mockSupabaseResponse))
      }))
    }))
  }))
};

jest.mock('@/lib/supabase-server', () => ({
  createClient: () => mockSupabaseClient
}));

describe('/api/presets/[presetId]/config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseResponse.data = null;
    mockSupabaseResponse.error = null;
  });

  describe('GET /api/presets/[presetId]/config', () => {
    it('should return preset configuration successfully', async () => {
      // Mock successful preset data
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        description: 'テスト用のプリセットです',
        form_expiry_date: '2025-12-31',
        is_active: true,
        form_settings: {
          id: 1,
          enable_birthday: true,
          enable_gender: false,
          enable_furigana: true,
          required_fields: ['user_name', 'phone_number', 'birthday'],
          optional_fields: ['furigana']
        },
        preset_products: [
          {
            id: 1,
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            display_order: 1,
            is_active: true,
            product: {
              id: 101,
              product_code: 'PROD_001',
              name: 'テスト商品1',
              variation_id: 1,
              variation_name: 'サイズM',
              tax_type: '内税',
              price: 1000,
              barcode: '1234567890123',
              visible: true,
              display_order: 1
            }
          },
          {
            id: 2,
            pickup_start: '2025-08-15',
            pickup_end: '2025-08-25',
            display_order: 2,
            is_active: true,
            product: {
              id: 102,
              product_code: 'PROD_002',
              name: 'テスト商品2',
              variation_id: 2,
              variation_name: 'サイズL',
              tax_type: '外税',
              price: 1500,
              barcode: '1234567890124',
              visible: true,
              display_order: 2
            }
          }
        ]
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('preset_name', 'テストプリセット');
      expect(data.data).toHaveProperty('form_settings');
      expect(data.data).toHaveProperty('products');
      expect(data.data.products).toHaveLength(2);
      
      // Verify product data structure
      expect(data.data.products[0]).toHaveProperty('id', 101);
      expect(data.data.products[0]).toHaveProperty('name', 'テスト商品1');
      expect(data.data.products[0]).toHaveProperty('price', 1000);
      expect(data.data.products[0]).toHaveProperty('pickup_start', '2025-08-10');
      expect(data.data.products[0]).toHaveProperty('pickup_end', '2025-08-20');
    });

    it('should return 404 for non-existent preset', async () => {
      // Mock preset not found
      mockSupabaseResponse.data = null;
      mockSupabaseResponse.error = null;

      const params = Promise.resolve({ presetId: '999' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
      expect(data.error).toContain('プリセットが見つかりません');
    });

    it('should return 400 for invalid preset ID', async () => {
      const params = Promise.resolve({ presetId: 'invalid' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('無効なプリセットID');
    });

    it('should filter out inactive products', async () => {
      // Mock preset with inactive products
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        description: 'テスト用のプリセットです',
        form_expiry_date: '2025-12-31',
        is_active: true,
        form_settings: {
          id: 1,
          enable_birthday: false,
          enable_gender: false,
          enable_furigana: false
        },
        preset_products: [
          {
            id: 1,
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            display_order: 1,
            is_active: true, // Active
            product: {
              id: 101,
              name: 'アクティブ商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: true
            }
          },
          {
            id: 2,
            pickup_start: '2025-08-15',
            pickup_end: '2025-08-25',
            display_order: 2,
            is_active: false, // Inactive
            product: {
              id: 102,
              name: '非アクティブ商品',
              variation_name: 'サイズL',
              price: 1500,
              visible: true
            }
          }
        ]
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(1);
      expect(data.data.products[0].name).toBe('アクティブ商品');
    });

    it('should filter out invisible products', async () => {
      // Mock preset with invisible products
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        description: 'テスト用のプリセットです',
        form_expiry_date: '2025-12-31',
        is_active: true,
        form_settings: {
          id: 1,
          enable_birthday: false,
          enable_gender: false,
          enable_furigana: false
        },
        preset_products: [
          {
            id: 1,
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            display_order: 1,
            is_active: true,
            product: {
              id: 101,
              name: '表示商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: true // Visible
            }
          },
          {
            id: 2,
            pickup_start: '2025-08-15',
            pickup_end: '2025-08-25',
            display_order: 2,
            is_active: true,
            product: {
              id: 102,
              name: '非表示商品',
              variation_name: 'サイズL',
              price: 1500,
              visible: false // Invisible
            }
          }
        ]
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(1);
      expect(data.data.products[0].name).toBe('表示商品');
    });

    it('should sort products by display_order', async () => {
      // Mock preset with products in different display order
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: {
          id: 1,
          enable_birthday: false,
          enable_gender: false,
          enable_furigana: false
        },
        preset_products: [
          {
            id: 1,
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            display_order: 3, // Third
            is_active: true,
            product: {
              id: 101,
              name: '商品C',
              variation_name: 'サイズM',
              price: 1000,
              visible: true
            }
          },
          {
            id: 2,
            pickup_start: '2025-08-15',
            pickup_end: '2025-08-25',
            display_order: 1, // First
            is_active: true,
            product: {
              id: 102,
              name: '商品A',
              variation_name: 'サイズL',
              price: 1500,
              visible: true
            }
          },
          {
            id: 3,
            pickup_start: '2025-08-12',
            pickup_end: '2025-08-22',
            display_order: 2, // Second
            is_active: true,
            product: {
              id: 103,
              name: '商品B',
              variation_name: 'サイズS',
              price: 800,
              visible: true
            }
          }
        ]
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(3);
      expect(data.data.products[0].name).toBe('商品A');
      expect(data.data.products[1].name).toBe('商品B');
      expect(data.data.products[2].name).toBe('商品C');
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockSupabaseResponse.error = {
        message: 'Database connection failed',
        code: 'PGRST001'
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('DATABASE_ERROR');
    });

    it('should handle missing form_settings gracefully', async () => {
      // Mock preset without form_settings
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: null, // No form settings
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.form_settings).toBeDefined();
      // Should provide default form settings
      expect(data.data.form_settings.enable_birthday).toBe(false);
      expect(data.data.form_settings.enable_gender).toBe(false);
      expect(data.data.form_settings.enable_furigana).toBe(false);
    });

    it('should return proper form configuration fields', async () => {
      // Mock preset with various form settings
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: {
          id: 1,
          enable_birthday: true,
          enable_gender: true,
          enable_furigana: false,
          required_fields: ['user_name', 'phone_number', 'birthday', 'gender'],
          optional_fields: []
        },
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.form_settings.enable_birthday).toBe(true);
      expect(data.data.form_settings.enable_gender).toBe(true);
      expect(data.data.form_settings.enable_furigana).toBe(false);
      expect(data.data.form_settings.required_fields).toContain('birthday');
      expect(data.data.form_settings.required_fields).toContain('gender');
    });

    it('should validate preset is active', async () => {
      // Mock inactive preset
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: false, // Inactive
        form_expiry_date: '2025-12-31',
        form_settings: {},
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRESET_ERROR');
      expect(data.error).toContain('無効なプリセット');
    });

    it('should validate preset expiry date', async () => {
      // Mock expired preset
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2020-01-01', // Expired
        form_settings: {},
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRESET_ERROR');
      expect(data.error).toContain('期限切れ');
    });
  });

  describe('Response Format Validation', () => {
    it('should return success response in correct format', async () => {
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: {},
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(data.meta).toHaveProperty('timestamp');
    });

    it('should return error response in correct format', async () => {
      mockSupabaseResponse.data = null;

      const params = Promise.resolve({ presetId: '999' });
      const response = await GET({} as NextRequest, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Database Query Validation', () => {
    it('should call correct Supabase query', async () => {
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: {},
        preset_products: []
      };

      const params = Promise.resolve({ presetId: '1' });
      await GET({} as NextRequest, { params });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('product_presets');
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith(
        expect.stringContaining('form_settings')
      );
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('id', 1);
    });
  });
});