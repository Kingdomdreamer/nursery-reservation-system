/**
 * usePresetConfig フックのテスト
 * プリセット設定取得の動作確認
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { usePresetConfig } from '@/hooks/usePresetConfig';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data for successful response
const mockValidResponse = {
  success: true,
  data: {
    id: 1,
    preset_name: 'テストプリセット',
    description: 'テスト用のプリセット',
    form_settings: {
      enable_birthday: true,
      enable_gender: false,
      enable_furigana: true,
      required_fields: ['user_name', 'phone_number', 'birthday'],
      optional_fields: ['furigana']
    },
    products: [
      {
        id: 101,
        name: 'テスト商品1',
        price: 1000,
        variation_name: 'サイズM',
        tax_type: '内税',
        pickup_start: '2025-08-10',
        pickup_end: '2025-08-20'
      }
    ]
  }
};

describe('usePresetConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Successful Data Fetching', () => {
    it('should fetch preset config successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockValidResponse,
        headers: {
          entries: () => []
        },
      } as Response);

      const { result } = renderHook(() => usePresetConfig(1));

      // Initial state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for data to be fetched
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockValidResponse.data);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/presets/1/config', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        }),
      }));
    });

    it('should handle empty products array', async () => {
      const mockEmptyProductsResponse = {
        success: true,
        data: {
          id: 1,
          preset_name: 'テストプリセット',
          form_settings: {
            enable_birthday: false,
            enable_gender: false,
            enable_furigana: false
          },
          products: []
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEmptyProductsResponse,
        headers: {
          entries: () => []
        },
      } as Response);

      const { result } = renderHook(() => usePresetConfig(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.products).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 error', async () => {
      const errorResponse = {
        error: 'プリセットが見つかりません',
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found.',
        timestamp: '2025-08-07T12:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
        headers: {
          entries: () => []
        },
      } as Response);

      const { result } = renderHook(() => usePresetConfig(999));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('プリセットが見つかりません');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePresetConfig(1));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle invalid preset ID', async () => {
      const { result } = renderHook(() => usePresetConfig(0));
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('無効なプリセットIDです');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Management', () => {
    it('should start with loading true', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => usePresetConfig(1));
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockValidResponse,
        headers: {
          entries: () => []
        },
      } as Response);

      const { result } = renderHook(() => usePresetConfig(1));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});