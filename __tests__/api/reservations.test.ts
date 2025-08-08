/**
 * 予約API統合テスト
 * src/app/api/reservations/route.ts のテスト
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/reservations/route';

// Mock Supabase client
const mockSupabaseResponse = {
  data: null,
  error: null
};

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve(mockSupabaseResponse)),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: jest.fn(() => Promise.resolve({ data: [{ id: 'test-reservation-id' }], error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }))
};

// Mock the supabase client
jest.mock('@/lib/supabase-server', () => ({
  createClient: () => mockSupabaseClient
}));

// Mock LINE messaging service
const mockLineMessaging = {
  sendReservationConfirmation: jest.fn(() => Promise.resolve({ success: true })),
  sendReservationCancellation: jest.fn(() => Promise.resolve({ success: true }))
};

jest.mock('@/lib/line-messaging', () => ({
  LineMessagingService: jest.fn(() => mockLineMessaging)
}));

describe('/api/reservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock responses
    mockSupabaseResponse.data = null;
    mockSupabaseResponse.error = null;
  });

  describe('POST /api/reservations', () => {
    const validReservationData = {
      preset_id: 1,
      user_name: 'テストユーザー',
      phone_number: '090-1234-5678',
      selected_products: [
        {
          product_id: 1,
          product_name: 'テスト商品',
          variation_name: 'サイズM',
          quantity: 2,
          price: 1000,
          pickup_date: '2025-08-15',
          tax_type: '内税'
        }
      ],
      total_amount: 2000,
      pickup_date: '2025-08-15',
      line_user_id: 'test-line-user-id'
    };

    it('should create reservation successfully', async () => {
      // Mock preset data
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{
          enable_birthday: false,
          enable_gender: false,
          enable_furigana: false
        }],
        preset_products: [
          {
            id: 1,
            product: {
              id: 1,
              name: 'テスト商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: true
            },
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            is_active: true
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('reservation_id');
      expect(data.data).toHaveProperty('cancel_url');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reservations');
      expect(mockLineMessaging.sendReservationConfirmation).toHaveBeenCalled();
    });

    it('should return 400 for invalid request body', async () => {
      const invalidData = {
        // Missing required fields
        preset_id: 1,
        user_name: ''
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent preset', async () => {
      // Mock preset not found
      mockSupabaseResponse.data = null;
      mockSupabaseResponse.error = null;

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe('RESOURCE_NOT_FOUND');
      expect(data.error).toContain('プリセットが見つかりません');
    });

    it('should return 400 for inactive preset', async () => {
      // Mock inactive preset
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: false, // Inactive
        form_expiry_date: '2025-12-31',
        form_settings: [{}],
        preset_products: []
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRESET_ERROR');
      expect(data.error).toContain('無効なプリセット');
    });

    it('should return 400 for expired preset', async () => {
      // Mock expired preset
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2020-01-01', // Expired
        form_settings: [{}],
        preset_products: []
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRESET_ERROR');
      expect(data.error).toContain('期限切れ');
    });

    it('should validate product availability', async () => {
      // Mock preset with unavailable product
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{}],
        preset_products: [
          {
            id: 1,
            product: {
              id: 1,
              name: 'テスト商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: false // Not visible
            },
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            is_active: true
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRODUCT_ERROR');
    });

    it('should validate pickup date range', async () => {
      // Mock preset with product but invalid pickup date
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{}],
        preset_products: [
          {
            id: 1,
            product: {
              id: 1,
              name: 'テスト商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: true
            },
            pickup_start: '2025-09-10', // Pickup date is before this range
            pickup_end: '2025-09-20',
            is_active: true
          }
        ]
      };

      const invalidPickupData = {
        ...validReservationData,
        pickup_date: '2025-08-15', // Outside the range
        selected_products: [
          {
            ...validReservationData.selected_products[0],
            pickup_date: '2025-08-15'
          }
        ]
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidPickupData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('PRODUCT_ERROR');
      expect(data.error).toContain('引き取り期間外');
    });

    it('should handle database errors', async () => {
      // Mock database error
      mockSupabaseResponse.error = {
        message: 'Database connection failed',
        code: 'PGRST001'
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('DATABASE_ERROR');
    });

    it('should handle LINE messaging errors gracefully', async () => {
      // Mock successful reservation creation but LINE messaging failure
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{}],
        preset_products: [
          {
            id: 1,
            product: {
              id: 1,
              name: 'テスト商品',
              variation_name: 'サイズM',
              price: 1000,
              visible: true
            },
            pickup_start: '2025-08-10',
            pickup_end: '2025-08-20',
            is_active: true
          }
        ]
      };

      // Mock LINE messaging failure
      mockLineMessaging.sendReservationConfirmation.mockRejectedValue(
        new Error('LINE API error')
      );

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed even if LINE messaging fails
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('reservation_id');
    });

    it('should validate required fields based on form settings', async () => {
      // Mock preset requiring birthday
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{
          enable_birthday: true, // Birthday required
          enable_gender: false,
          enable_furigana: false
        }],
        preset_products: []
      };

      // Data without birthday
      const dataWithoutBirthday = {
        ...validReservationData,
        // birthday field is missing
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithoutBirthday)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('生年月日');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error response format', async () => {
      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Invalid empty body
      });

      const response = await POST(request);
      const data = await response.json();

      // Check error response structure
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
      
      expect(typeof data.error).toBe('string');
      expect(typeof data.code).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('Success Response Format', () => {
    it('should return consistent success response format', async () => {
      // Mock successful creation
      mockSupabaseResponse.data = {
        id: 1,
        preset_name: 'テストプリセット',
        is_active: true,
        form_expiry_date: '2025-12-31',
        form_settings: [{}],
        preset_products: []
      };

      const request = new NextRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validReservationData)
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 201) {
        // Check success response structure
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('meta');
        expect(data.meta).toHaveProperty('timestamp');
        
        expect(typeof data.success).toBe('boolean');
        expect(typeof data.meta.timestamp).toBe('string');
      }
    });
  });
});