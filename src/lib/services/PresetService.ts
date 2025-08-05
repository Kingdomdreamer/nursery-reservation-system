// =====================================
// ビジネスロジック層 - プリセットサービス
// 仕様設計問題分析_改善指示書.md に基づく実装
// =====================================

import { PresetRepository } from '@/lib/repositories/PresetRepository';
import { 
  FormConfigResponse, 
  PresetProduct,
  PickupWindow 
} from '@/types';

/**
 * プリセットビジネスロジック層
 * ビジネスルールの適用と データアクセス層の抽象化を担当
 */
export class PresetService {
  /**
   * フォーム設定の取得（ビジネスルール適用済み）
   */
  static async getFormConfig(presetId: number): Promise<FormConfigResponse> {
    console.log(`[PresetService] Getting form config for preset: ${presetId}`);
    
    // データアクセス層からデータ取得
    const config = await PresetRepository.getPresetConfig(presetId);
    
    // ビジネスルールの適用
    const processedConfig = this.applyBusinessRules(config);
    
    console.log(`[PresetService] Applied business rules for preset ${presetId}:`, {
      active_products: processedConfig.preset_products.length,
      available_schedules: processedConfig.pickup_windows.length
    });
    
    return processedConfig;
  }

  /**
   * フォーム設定の更新
   */
  static async updateFormConfig(
    presetId: number, 
    updateData: Partial<FormConfigResponse>
  ): Promise<FormConfigResponse> {
    console.log(`[PresetService] Updating form config for preset: ${presetId}`);
    
    // データの検証
    this.validateUpdateData(updateData);
    
    // データアクセス層で更新実行
    await PresetRepository.updatePresetConfig(presetId, updateData);
    
    // 更新後のデータを再取得して返却
    return await this.getFormConfig(presetId);
  }

  /**
   * ビジネスルールの適用
   */
  private static applyBusinessRules(config: FormConfigResponse): FormConfigResponse {
    // 1. アクティブな商品のみフィルタ
    const activeProducts = config.preset_products.filter(pp => 
      pp.is_active && pp.product && pp.product.visible
    );

    // 2. 商品の表示順序でソート
    activeProducts.sort((a, b) => a.display_order - b.display_order);

    // 3. 利用可能な引き取り日程のみフィルタ
    const availableWindows = config.pickup_windows.filter(pw => 
      new Date(pw.pickup_start) >= new Date()
    );

    // 4. 日程を日付順でソート
    availableWindows.sort((a, b) => 
      new Date(a.pickup_start).getTime() - new Date(b.pickup_start).getTime()
    );

    return {
      ...config,
      preset_products: activeProducts,
      pickup_windows: availableWindows
    };
  }

  /**
   * 更新データの検証
   */
  private static validateUpdateData(updateData: Partial<FormConfigResponse>): void {
    // フォーム設定の検証
    if (updateData.form_settings) {
      const fs = updateData.form_settings;
      
      if (typeof fs.show_price !== 'undefined' && typeof fs.show_price !== 'boolean') {
        throw new Error('show_price must be a boolean');
      }
      
      if (typeof fs.require_phone !== 'undefined' && typeof fs.require_phone !== 'boolean') {
        throw new Error('require_phone must be a boolean');
      }
      
      if (typeof fs.is_enabled !== 'undefined' && typeof fs.is_enabled !== 'boolean') {
        throw new Error('is_enabled must be a boolean');
      }
    }

    // プリセット商品の検証
    if (updateData.preset_products) {
      updateData.preset_products.forEach((pp, index) => {
        if (!Number.isInteger(pp.product_id) || pp.product_id < 1) {
          throw new Error(`preset_products[${index}].product_id must be a positive integer`);
        }
        
        if (!Number.isInteger(pp.display_order) || pp.display_order < 0) {
          throw new Error(`preset_products[${index}].display_order must be a non-negative integer`);
        }
        
        if (typeof pp.is_active !== 'boolean') {
          throw new Error(`preset_products[${index}].is_active must be a boolean`);
        }
      });
    }

    // 引き取り日程の検証
    if (updateData.pickup_windows) {
      updateData.pickup_windows.forEach((pw, index) => {
        if (!this.isValidDate(pw.pickup_start)) {
          throw new Error(`pickup_windows[${index}].pickup_start must be a valid datetime`);
        }
        
        if (!this.isValidDate(pw.pickup_end)) {
          throw new Error(`pickup_windows[${index}].pickup_end must be a valid datetime`);
        }
        
        // 開始時間が終了時間より前であることを確認
        if (new Date(pw.pickup_start) >= new Date(pw.pickup_end)) {
          throw new Error(`pickup_windows[${index}]: pickup_start must be before pickup_end`);
        }
      });
    }
  }

  /**
   * 有効な日付形式かチェック
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * 有効な時間形式かチェック（HH:MM:SS形式）
   */
  private static isValidTime(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * プリセットの利用可能性チェック
   */
  static async isPresetAvailable(presetId: number): Promise<boolean> {
    try {
      const config = await this.getFormConfig(presetId);
      
      return (
        config.form_settings.is_enabled &&
        config.preset_products.length > 0 &&
        config.pickup_windows.length > 0
      );
    } catch (error) {
      console.error(`[PresetService] Error checking availability for preset ${presetId}:`, error);
      return false;
    }
  }

  /**
   * プリセットの統計情報取得
   */
  static async getPresetStats(presetId: number): Promise<{
    total_products: number;
    active_products: number;
    total_schedules: number;
    available_schedules: number;
    is_enabled: boolean;
  }> {
    const config = await PresetRepository.getPresetConfig(presetId);
    
    return {
      total_products: config.preset_products.length,
      active_products: config.preset_products.filter(pp => pp.is_active).length,
      total_schedules: config.pickup_windows.length,
      available_schedules: config.pickup_windows.length, // pickup_windows don't have is_available field
      is_enabled: config.form_settings.is_enabled
    };
  }
}