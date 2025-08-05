// =====================================
// PresetService のテスト
// 仕様設計問題分析_改善指示書.md に基づくテスト実装
// =====================================

import { PresetService } from '@/lib/services/PresetService';
import { PresetRepository } from '@/lib/repositories/PresetRepository';
import { FormConfigResponse } from '@/types/simplified';

// PresetRepository のモック
jest.mock('@/lib/repositories/PresetRepository');
const mockPresetRepository = PresetRepository as jest.Mocked<typeof PresetRepository>;

describe('PresetService', () => {
  const mockFormConfig: FormConfigResponse = {
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
    preset_products: [
      {
        id: 1,
        preset_id: 1,
        product_id: 1,
        display_order: 0,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        product: {
          id: 1,
          name: 'Active Product',
          category_id: 1,
          price: 1000,
          visible: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      },
      {
        id: 2,
        preset_id: 1,
        product_id: 2,
        display_order: 1,
        is_active: false, // 非アクティブ
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        product: {
          id: 2,
          name: 'Inactive Product',
          category_id: 1,
          price: 2000,
          visible: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      }
    ],
    pickup_schedules: [
      {
        id: 1,
        preset_id: 1,
        pickup_date: '2025-12-31', // 未来の日付
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 2,
        preset_id: 1,
        pickup_date: '2020-01-01', // 過去の日付
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 3,
        preset_id: 1,
        pickup_date: '2025-12-30', // 未来の日付だが利用不可
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFormConfig', () => {
    it('should apply business rules correctly', async () => {
      mockPresetRepository.getPresetConfig.mockResolvedValue(mockFormConfig);

      const result = await PresetService.getFormConfig(1);

      expect(mockPresetRepository.getPresetConfig).toHaveBeenCalledWith(1);
      
      // アクティブな商品のみが含まれることを確認
      expect(result.preset_products).toHaveLength(1);
      expect(result.preset_products[0].product.name).toBe('Active Product');
      
      // 未来かつ利用可能な日程のみが含まれることを確認
      expect(result.pickup_schedules).toHaveLength(1);
      expect(result.pickup_schedules[0].pickup_date).toBe('2025-12-31');
    });

    it('should sort products by display_order', async () => {
      const configWithMultipleProducts = {
        ...mockFormConfig,
        preset_products: [
          {
            ...mockFormConfig.preset_products[0],
            id: 3,
            display_order: 2,
            product: { ...mockFormConfig.preset_products[0].product, id: 3, name: 'Product C' }
          },
          {
            ...mockFormConfig.preset_products[0],
            id: 1,
            display_order: 0,
            product: { ...mockFormConfig.preset_products[0].product, id: 1, name: 'Product A' }
          },
          {
            ...mockFormConfig.preset_products[0],
            id: 2,
            display_order: 1,
            product: { ...mockFormConfig.preset_products[0].product, id: 2, name: 'Product B' }
          }
        ]
      };

      mockPresetRepository.getPresetConfig.mockResolvedValue(configWithMultipleProducts);

      const result = await PresetService.getFormConfig(1);

      expect(result.preset_products[0].product.name).toBe('Product A');
      expect(result.preset_products[1].product.name).toBe('Product B');
      expect(result.preset_products[2].product.name).toBe('Product C');
    });

    it('should sort schedules by date', async () => {
      const configWithMultipleSchedules = {
        ...mockFormConfig,
        pickup_schedules: [
          {
            ...mockFormConfig.pickup_schedules[0],
            id: 2,
            pickup_date: '2025-12-31'
          },
          {
            ...mockFormConfig.pickup_schedules[0],
            id: 1,
            pickup_date: '2025-12-30'
          }
        ]
      };

      mockPresetRepository.getPresetConfig.mockResolvedValue(configWithMultipleSchedules);

      const result = await PresetService.getFormConfig(1);

      expect(result.pickup_schedules[0].pickup_date).toBe('2025-12-30');
      expect(result.pickup_schedules[1].pickup_date).toBe('2025-12-31');
    });

    it('should handle repository errors', async () => {
      const error = new Error('Repository error');
      mockPresetRepository.getPresetConfig.mockRejectedValue(error);

      await expect(PresetService.getFormConfig(1)).rejects.toThrow('Repository error');
    });
  });

  describe('updateFormConfig', () => {
    const validUpdateData = {
      form_settings: {
        id: 1,
        preset_id: 1,
        show_price: false,
        require_phone: true,
        require_furigana: true,
        allow_note: false,
        is_enabled: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    };

    it('should update and return updated config', async () => {
      mockPresetRepository.updatePresetConfig.mockResolvedValue();
      mockPresetRepository.getPresetConfig.mockResolvedValue(mockFormConfig);

      const result = await PresetService.updateFormConfig(1, validUpdateData);

      expect(mockPresetRepository.updatePresetConfig).toHaveBeenCalledWith(1, validUpdateData);
      expect(mockPresetRepository.getPresetConfig).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFormConfig);
    });

    it('should validate form settings data', async () => {
      const invalidUpdateData = {
        form_settings: {
          id: 1,
          preset_id: 1,
          show_price: 'invalid', // boolean以外
          require_phone: true,
          require_furigana: false,
          allow_note: true,
          is_enabled: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      await expect(PresetService.updateFormConfig(1, invalidUpdateData as any))
        .rejects.toThrow('show_price must be a boolean');
    });

    it('should validate preset products data', async () => {
      const invalidUpdateData = {
        preset_products: [{
          id: 1,
          preset_id: 1,
          product_id: -1, // 無効な値
          display_order: 0,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          product: mockFormConfig.preset_products[0].product
        }]
      };

      await expect(PresetService.updateFormConfig(1, invalidUpdateData))
        .rejects.toThrow('preset_products[0].product_id must be a positive integer');
    });

    it('should validate pickup schedules data', async () => {
      const invalidUpdateData = {
        pickup_schedules: [{
          id: 1,
          preset_id: 1,
          pickup_date: 'invalid-date',
          start_time: '09:00:00',
          end_time: '17:00:00',
          is_available: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }]
      };

      await expect(PresetService.updateFormConfig(1, invalidUpdateData))
        .rejects.toThrow('pickup_schedules[0].pickup_date must be a valid date');
    });

    it('should validate time format', async () => {
      const invalidUpdateData = {
        pickup_schedules: [{
          id: 1,
          preset_id: 1,
          pickup_date: '2025-01-01',
          start_time: 'invalid-time',
          end_time: '17:00:00',
          is_available: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }]
      };

      await expect(PresetService.updateFormConfig(1, invalidUpdateData))
        .rejects.toThrow('pickup_schedules[0].start_time must be a valid time');
    });

    it('should validate start time is before end time', async () => {
      const invalidUpdateData = {
        pickup_schedules: [{
          id: 1,
          preset_id: 1,
          pickup_date: '2025-01-01',
          start_time: '18:00:00',
          end_time: '17:00:00',
          is_available: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }]
      };

      await expect(PresetService.updateFormConfig(1, invalidUpdateData))
        .rejects.toThrow('pickup_schedules[0]: start_time must be before end_time');
    });
  });

  describe('isPresetAvailable', () => {
    it('should return true when preset is available', async () => {
      mockPresetRepository.getPresetConfig.mockResolvedValue(mockFormConfig);

      const result = await PresetService.isPresetAvailable(1);

      expect(result).toBe(true);
    });

    it('should return false when form settings is disabled', async () => {
      const disabledConfig = {
        ...mockFormConfig,
        form_settings: {
          ...mockFormConfig.form_settings,
          is_enabled: false
        }
      };

      mockPresetRepository.getPresetConfig.mockResolvedValue(disabledConfig);

      const result = await PresetService.isPresetAvailable(1);

      expect(result).toBe(false);
    });

    it('should return false when no products available', async () => {
      const noProductsConfig = {
        ...mockFormConfig,
        preset_products: []
      };

      mockPresetRepository.getPresetConfig.mockResolvedValue(noProductsConfig);

      const result = await PresetService.isPresetAvailable(1);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockPresetRepository.getPresetConfig.mockRejectedValue(new Error('Test error'));

      const result = await PresetService.isPresetAvailable(1);

      expect(result).toBe(false);
    });
  });

  describe('getPresetStats', () => {
    it('should return correct statistics', async () => {
      mockPresetRepository.getPresetConfig.mockResolvedValue(mockFormConfig);

      const result = await PresetService.getPresetStats(1);

      expect(result).toEqual({
        total_products: 2,
        active_products: 1,
        total_schedules: 3,
        available_schedules: 2, // is_available が true のもの
        is_enabled: true
      });
    });
  });
});