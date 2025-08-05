/**
 * 統一プリセット設定API - 改善指示書に基づく実装
 * GET /api/presets/{presetId}/config
 * フォーム設定、商品、日程を一括取得する統一エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  handleApiError, 
  createSuccessResponse,
  createValidationError 
} from '@/lib/utils/apiErrorHandler';
import { 
  InvalidPresetIdError,
  PresetNotFoundError,
  parseFormConfigResponse 
} from '@/types/simplified';
import type { FormConfigResponse } from '@/types/simplified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    // パラメータの安全な取得と検証
    const { presetId } = await params;
    const id = Number(presetId);
    
    if (!Number.isInteger(id) || id < 1) {
      throw new InvalidPresetIdError(presetId);
    }

    console.log(`[Config API] Fetching config for preset: ${id}`);

    // Supabase接続確認
    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }

    // 単一のクエリで必要なデータを全て取得（改善指示書提案）
    const { data: presetData, error: dbError } = await supabaseAdmin
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
          enable_birthday,
          enable_gender,
          require_address,
          enable_furigana,
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
      .eq('id', id)
      .single();

    if (dbError) {
      console.error('[Config API] Database query error:', dbError);
      if (dbError.code === 'PGRST116') {
        throw new PresetNotFoundError(id);
      }
      throw dbError;
    }

    if (!presetData) {
      throw new PresetNotFoundError(id);
    }

    // pickup_windowsデータの取得（互換性のため）
    const { data: pickupWindows, error: pickupError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', id);

    if (pickupError) {
      console.warn('[Config API] Pickup windows query error:', pickupError);
    }

    // データの整形と検証
    const activePresetProducts = (presetData.preset_products || [])
      .filter((pp: any) => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        return pp.is_active && product && product.visible;
      })
      .map((pp: any) => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        return {
          ...pp,
          product: product
        };
      })
      .sort((a: any, b: any) => (a.display_order || 999) - (b.display_order || 999));

    // レスポンスデータの構築（既存型に準拠）
    const responseData: FormConfigResponse = {
      preset: {
        id: presetData.id,
        name: presetData.preset_name,
        description: presetData.description,
        created_at: presetData.created_at,
        updated_at: presetData.updated_at
      },
      form_settings: presetData.form_settings?.[0] || {
        id: 0,
        preset_id: id,
        show_price: true,
        require_phone: true,
        require_furigana: false,
        allow_note: true,
        is_enabled: true,
        custom_message: null,
        enable_birthday: false,
        enable_gender: false,
        require_address: false,
        enable_furigana: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      products: activePresetProducts.map((pp: any) => pp.product),
      pickup_windows: pickupWindows || []
    };

    console.log(`[Config API] Successfully fetched config for preset ${id}:`, {
      preset_products_count: activePresetProducts.length,
      form_settings_exists: !!(presetData.form_settings && presetData.form_settings.length > 0)
    });

    return createSuccessResponse(responseData, {
      presetId: id,
      totalProducts: activePresetProducts.length,
      hasFormSettings: !!(presetData.form_settings && presetData.form_settings.length > 0)
    });

  } catch (error) {
    console.error('[Config API] Error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/presets/{presetId}/config
 * プリセット設定の更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const { presetId } = await params;
    const id = Number(presetId);
    
    if (!Number.isInteger(id) || id < 1) {
      throw new InvalidPresetIdError(presetId);
    }

    const updateData = await request.json();
    
    // データの検証
    if (!updateData || typeof updateData !== 'object') {
      return createValidationError('更新データが無効です');
    }

    console.log(`[Config API] Updating config for preset: ${id}`);

    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }

    // プリセットの存在確認
    const { data: existingPreset, error: checkError } = await supabaseAdmin
      .from('product_presets')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingPreset) {
      throw new PresetNotFoundError(id);
    }

    // フォーム設定の更新
    if (updateData.form_settings) {
      const { error: formError } = await supabaseAdmin
        .from('form_settings')
        .upsert({
          preset_id: id,
          ...updateData.form_settings,
          updated_at: new Date().toISOString()
        });

      if (formError) {
        throw formError;
      }
    }

    // プリセット商品の更新
    if (updateData.preset_products && Array.isArray(updateData.preset_products)) {
      const { error: productsError } = await supabaseAdmin
        .from('preset_products')
        .upsert(
          updateData.preset_products.map((pp: any) => ({
            preset_id: id,
            ...pp,
            updated_at: new Date().toISOString()
          }))
        );

      if (productsError) {
        throw productsError;
      }
    }

    console.log(`[Config API] Successfully updated config for preset ${id}`);

    return createSuccessResponse(
      { message: '設定が正常に更新されました' },
      { presetId: id }
    );

  } catch (error) {
    console.error('[Config API] Update error:', error);
    return handleApiError(error);
  }
}