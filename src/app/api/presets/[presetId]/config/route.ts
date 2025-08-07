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
  PresetNotFoundError
} from '@/types';
import type { FormConfigResponse } from '@/types';

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

    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    // 新しいDB構造に対応したクエリ（指示書に従い改善）
    const { data: presetData, error: dbError } = await supabaseAdmin
      .from('product_presets')
      .select(`
        id,
        preset_name,
        description,
        form_expiry_date,
        is_active,
        created_at,
        updated_at,
        form_settings (
          id,
          preset_id,
          show_name,
          show_furigana,
          show_gender,
          show_birthday,
          show_phone,
          show_zip,
          show_address1,
          show_address2,
          show_comment,
          show_price,
          show_total,
          require_phone,
          require_furigana,
          allow_note,
          enable_birthday,
          enable_gender,
          require_address,
          enable_furigana,
          is_enabled,
          custom_message,
          created_at,
          updated_at
        ),
        preset_products (
          id,
          preset_id,
          product_id,
          pickup_start,
          pickup_end,
          display_order,
          is_active,
          created_at,
          updated_at,
          product:products (
            id,
            product_code,
            name,
            variation_id,
            variation_name,
            tax_type,
            price,
            barcode,
            visible,
            display_order,
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
        console.error(`[Config API] Preset ${id} not found in database`);
        
        // 利用可能なプリセット一覧を取得してログに出力
        try {
          const { data: availablePresets } = await supabaseAdmin
            .from('product_presets')
            .select('id, preset_name')
            .order('id');
          
          console.log('[Config API] Available presets:', availablePresets);
          
          return NextResponse.json({
            error: `プリセット${id}が見つかりません`,
            available_presets: availablePresets,
            suggestion: availablePresets && availablePresets.length > 0 
              ? `利用可能なプリセット: ${availablePresets.map(p => `${p.id}(${p.preset_name})`).join(', ')}`
              : 'プリセットが1つも作成されていません。管理画面から作成してください。'
          }, { status: 404 });
        } catch (listError) {
          console.error('[Config API] Error fetching available presets:', listError);
        }
        
        throw new PresetNotFoundError(id);
      }
      throw dbError;
    }

    if (!presetData) {
      console.error(`[Config API] Preset ${id} data is null`);
      throw new PresetNotFoundError(id);
    }

    // pickup_windowsデータの取得（互換性のため）
    const { data: pickupWindows, error: pickupError } = await supabaseAdmin
      .from('pickup_windows')
      .select('*')
      .eq('preset_id', id)
      .eq('is_available', true)
      .order('start_date');

    if (pickupError) {
      console.warn('[Config API] Pickup windows query error:', pickupError);
    }

    // データの整形と検証
    console.log(`[Config API] Raw preset_products for preset ${id}:`, presetData.preset_products);
    
    const activePresetProducts = (presetData.preset_products || [])
      .filter((pp: any) => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        
        // デバッグログ
        console.log(`[Config API] Filtering product:`, {
          preset_product_id: pp.id,
          product_id: pp.product_id,
          is_active: pp.is_active,
          product_exists: !!product,
          product_visible: product?.visible,
          will_include: pp.is_active && product && product.visible
        });
        
        return pp.is_active && product && product.visible;
      })
      .map((pp: any) => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        return {
          ...pp,
          product: product,
          // 新しいDB構造のフィールドを保持
          pickup_start: pp.pickup_start,
          pickup_end: pp.pickup_end
        };
      })
      .sort((a: any, b: any) => (a.display_order || 999) - (b.display_order || 999));

    // レスポンスデータの構築（既存型に準拠）
    const responseData: FormConfigResponse = {
      preset: {
        id: presetData.id,
        preset_name: presetData.preset_name,
        description: (presetData as any).description || '',
        form_expiry_date: (presetData as any).form_expiry_date,
        is_active: (presetData as any).is_active || true,
        created_at: presetData.created_at,
        updated_at: presetData.updated_at
      },
      form_settings: presetData.form_settings?.[0] || {
        id: 0,
        preset_id: id,
        // 新しいフィールド構造に対応
        show_name: true,
        show_furigana: true,
        show_gender: false,
        show_birthday: false,
        show_phone: true,
        show_zip: false,
        show_address1: false,
        show_address2: false,
        show_comment: true,
        show_price: true,
        show_total: true,
        // 互換性フィールド
        require_phone: true,
        require_furigana: false,
        allow_note: true,
        enable_birthday: false,
        enable_gender: false,
        require_address: false,
        enable_furigana: true,
        is_enabled: true,
        custom_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      products: activePresetProducts.map((pp: any) => pp.product),
      pickup_windows: pickupWindows || [],
      preset_products: activePresetProducts
    };

    console.log(`[Config API] Successfully fetched config for preset ${id}:`, {
      products_count: activePresetProducts.length,
      pickup_windows_count: (pickupWindows || []).length,
      form_settings_exists: !!(presetData.form_settings && presetData.form_settings.length > 0)
    });

    return createSuccessResponse(responseData, {
      presetId: id,
      totalProducts: activePresetProducts.length,
      totalPickupWindows: (pickupWindows || []).length,
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

    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
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