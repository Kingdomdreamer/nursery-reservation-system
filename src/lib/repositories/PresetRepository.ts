// =====================================
// データアクセス層 - プリセットリポジトリ
// 仕様設計問題分析_改善指示書.md に基づく実装
// =====================================

import { supabaseAdmin } from '@/lib/supabase';
import { 
  FormConfigResponse, 
  PresetNotFoundError,
  InvalidProductDataError 
} from '@/types';

/**
 * プリセットデータアクセス層
 * データベースとの直接的なやり取りを担当
 */
export class PresetRepository {
  /**
   * プリセット設定を一括取得
   * 単一のクエリで必要なデータを全て取得
   */
  static async getPresetConfig(presetId: number): Promise<FormConfigResponse> {
    console.log(`[PresetRepository] Fetching config for preset: ${presetId}`);
    
    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }

    // 単一のクエリで必要なデータを全て取得
    const { data, error } = await supabaseAdmin
      .from('product_presets')
      .select(`
        id,
        preset_name,
        description,
        created_at,
        updated_at,
        form_settings (
          id,
          preset_id,
          show_price,
          require_phone,
          require_furigana,
          allow_note,
          is_enabled,
          custom_message,
          created_at,
          updated_at
        ),
        preset_products (
          id,
          preset_id,
          product_id,
          display_order,
          is_active,
          created_at,
          updated_at,
          product:products (
            id,
            name,
            category_id,
            price,
            visible,
            created_at,
            updated_at
          )
        )
      `)
      .eq('id', presetId)
      .single();

    if (error) {
      console.error('[PresetRepository] Database error:', error);
      if (error.code === 'PGRST116') {
        throw new PresetNotFoundError(presetId);
      }
      throw error;
    }

    if (!data) {
      throw new PresetNotFoundError(presetId);
    }

    // 引き取り日程の取得（互換性のため別クエリ）
    const { data: pickupSchedules, error: scheduleError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', presetId);

    if (scheduleError) {
      console.warn('[PresetRepository] Pickup schedules query error:', scheduleError);
    }

    // データの変換とバリデーション
    return this.transformToFormConfigResponse(data, pickupSchedules || []);
  }

  /**
   * データベースの生データを FormConfigResponse 形式に変換
   */
  private static transformToFormConfigResponse(
    data: any, 
    pickupSchedules: any[]
  ): FormConfigResponse {
    try {
      // プリセット商品の処理
      const presetProducts = (data.preset_products || [])
        .filter((pp: any) => {
          const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
          return pp.is_active && product && product.visible;
        })
        .map((pp: any) => {
          const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
          if (!product) {
            throw new InvalidProductDataError(pp);
          }
          
          return {
            id: pp.id,
            preset_id: pp.preset_id,
            product_id: pp.product_id,
            display_order: pp.display_order || 0,
            is_active: pp.is_active,
            created_at: pp.created_at,
            updated_at: pp.updated_at,
            product: {
              id: product.id,
              name: product.name,
              category_id: product.category_id || 0,
              price: product.price,
              visible: product.visible,
              created_at: product.created_at,
              updated_at: product.updated_at
            }
          };
        })
        .sort((a: any, b: any) => a.display_order - b.display_order);

      // 引き取り日程の処理（pickup_windows形式を保持）
      const pickupWindowsTransformed = pickupSchedules.map(pw => ({
        id: pw.id,
        preset_id: pw.preset_id,
        product_id: pw.product_id || null,
        pickup_start: pw.pickup_start,
        pickup_end: pw.pickup_end,
        dates: pw.dates || [],
        price: pw.price || null,
        comment: pw.comment || null,
        variation: pw.variation || null,
        created_at: pw.created_at,
        updated_at: pw.updated_at,
        product: pw.product || null
      }));

      const response: FormConfigResponse = {
        preset: {
          id: data.id,
          preset_name: data.preset_name,
          description: (data as any).description || '',
          form_expiry_date: (data as any).form_expiry_date,
          is_active: (data as any).is_active || true,
          created_at: data.created_at,
          updated_at: data.updated_at
        },
        form_settings: data.form_settings?.[0] ? {
          id: data.form_settings[0].id,
          preset_id: data.form_settings[0].preset_id,
          show_price: data.form_settings[0].show_price,
          require_phone: data.form_settings[0].require_phone,
          require_furigana: data.form_settings[0].require_furigana,
          allow_note: data.form_settings[0].allow_note,
          is_enabled: data.form_settings[0].is_enabled,
          custom_message: data.form_settings[0].custom_message,
          created_at: data.form_settings[0].created_at,
          updated_at: data.form_settings[0].updated_at
        } : {
          id: 0,
          preset_id: data.id,
          show_price: true,
          require_phone: true,
          require_furigana: false,
          allow_note: true,
          is_enabled: true,
          custom_message: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        products: presetProducts.map((pp: any) => pp.product),
        pickup_windows: pickupWindowsTransformed,
        preset_products: presetProducts
      };

      console.log(`[PresetRepository] Successfully transformed data for preset ${data.id}:`, {
        preset_products_count: presetProducts.length,
        pickup_windows_count: pickupWindowsTransformed.length
      });

      return response;

    } catch (error) {
      console.error('[PresetRepository] Data transformation error:', error);
      throw new InvalidProductDataError(data);
    }
  }

  /**
   * プリセット設定の更新
   */
  static async updatePresetConfig(
    presetId: number, 
    updateData: Partial<FormConfigResponse>
  ): Promise<void> {
    console.log(`[PresetRepository] Updating config for preset: ${presetId}`);
    
    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }

    // プリセットの存在確認
    const { data: existingPreset, error: checkError } = await supabaseAdmin
      .from('product_presets')
      .select('id')
      .eq('id', presetId)
      .single();

    if (checkError || !existingPreset) {
      throw new PresetNotFoundError(presetId);
    }

    // フォーム設定の更新
    if (updateData.form_settings) {
      const { preset_id, ...formSettingsData } = updateData.form_settings;
      const { error: formError } = await supabaseAdmin
        .from('form_settings')
        .upsert({
          preset_id: presetId,
          ...formSettingsData,
          updated_at: new Date().toISOString()
        });

      if (formError) {
        throw formError;
      }
    }

    // プリセット商品の更新
    if (updateData.preset_products) {
      const { error: productsError } = await supabaseAdmin
        .from('preset_products')
        .upsert(
          updateData.preset_products.map(pp => ({
            preset_id: presetId,
            product_id: pp.product_id,
            display_order: pp.display_order,
            is_active: pp.is_active,
            updated_at: new Date().toISOString()
          }))
        );

      if (productsError) {
        throw productsError;
      }
    }

    console.log(`[PresetRepository] Successfully updated config for preset ${presetId}`);
  }
}