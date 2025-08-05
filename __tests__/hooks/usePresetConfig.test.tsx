// =====================================
// usePresetConfig フックのテスト
// 仕様設計問題分析_改善指示書.md に基づくテスト実装
// =====================================

import { renderHook, waitFor } from '@testing-library/react';
import { usePresetConfig } from '@/hooks/usePresetConfig';

// フェッチのモック
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// 有効なレスポンスデータ
const mockValidResponse = {
  success: true,
  data: {
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
      product: {
        id: 1,
        name: 'Test Product',
        category_id: 1,
        price: 1000,
        visible: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
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
  }
};

describe('usePresetConfig', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockFetch.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const { result } = renderHook(() => usePresetConfig(1));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch and return data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockValidResponse
    } as Response);

    const { result } = renderHook(() => usePresetConfig(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockValidResponse.data);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/presets/1/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  });

  it('should handle API error response', async () => {
    const errorResponse = {
      success: false,
      error: 'Preset not found'
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => errorResponse
    } as Response);

    const { result } = renderHook(() => usePresetConfig(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Preset not found');
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePresetConfig(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle invalid preset ID', async () => {
    const { result } = renderHook(() => usePresetConfig(-1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('無効なプリセットIDです');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should refetch data when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockValidResponse
    } as Response);

    const { result } = renderHook(() => usePresetConfig(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // refetch を呼び出し
    await result.current.refetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not fetch when disabled', () => {
    const { result } = renderHook(() => 
      usePresetConfig(1, { enabled: false })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should retry on failure', async () => {
    // 最初の2回は失敗、3回目は成功
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidResponse
      } as Response);

    const { result } = renderHook(() => 
      usePresetConfig(1, { 
        retryCount: 3, 
        retryDelay: 10 
      })
    );

    // リトライが完了するまで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.data).toEqual(mockValidResponse.data);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle invalid API response format', async () => {
    const invalidResponse = {
      success: true,
      data: {
        // 不完全なデータ構造
        preset: null
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidResponse
    } as Response);

    const { result } = renderHook(() => usePresetConfig(1));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toContain('Invalid API response');
  });
});