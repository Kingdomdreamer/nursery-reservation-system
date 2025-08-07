import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * デバッグ用プリセット一覧取得API
 * 利用可能なプリセットとその状態を確認
 */
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase admin client not available'
      }, { status: 500 });
    }

    // すべてのプリセット取得
    const { data: presets, error: presetsError } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .order('id');

    if (presetsError) {
      console.error('Presets query error:', presetsError);
      return NextResponse.json({
        error: 'Failed to fetch presets',
        details: presetsError.message
      }, { status: 500 });
    }

    // 各プリセットの詳細情報を取得
    const presetDetails = await Promise.all(
      (presets || []).map(async (preset) => {
        if (!supabaseAdmin) {
          return {
            ...preset,
            form_settings: null,
            products_count: 0,
            active_products_count: 0,
            pickup_windows_count: 0,
            status: {
              has_form_settings: false,
              has_products: false,
              has_active_products: false,
              has_pickup_windows: false,
              is_functional: false
            },
            issues: ['データベース接続エラー']
          };
        }
        
        // フォーム設定
        const { data: formSettings } = await supabaseAdmin
          .from('form_settings')
          .select('*')
          .eq('preset_id', preset.id);

        // プリセット商品
        const { data: presetProducts } = await supabaseAdmin
          .from('preset_products')
          .select(`
            id,
            product_id,
            is_active,
            display_order,
            product:products (
              id,
              name,
              visible,
              price
            )
          `)
          .eq('preset_id', preset.id)
          .order('display_order');

        // ピックアップウィンドウ
        const { data: pickupWindows } = await supabaseAdmin
          .from('pickup_windows')
          .select('*')
          .eq('preset_id', preset.id);

        // アクティブな商品をカウント
        const activeProducts = (presetProducts || []).filter((pp: any) => 
          pp.is_active && pp.product && pp.product.visible
        );

        return {
          ...preset,
          form_settings: formSettings?.[0] || null,
          products_count: presetProducts?.length || 0,
          active_products_count: activeProducts.length,
          pickup_windows_count: pickupWindows?.length || 0,
          status: {
            has_form_settings: !!(formSettings && formSettings.length > 0),
            has_products: (presetProducts?.length || 0) > 0,
            has_active_products: activeProducts.length > 0,
            has_pickup_windows: (pickupWindows?.length || 0) > 0,
            is_functional: !!(
              formSettings && formSettings.length > 0 &&
              activeProducts.length > 0 &&
              pickupWindows && pickupWindows.length > 0
            )
          },
          issues: []
        };
      })
    );

    // 問題のあるプリセットにissuesを追加
    presetDetails.forEach(preset => {
      if (!preset.status.has_form_settings) {
        preset.issues.push('フォーム設定なし');
      }
      if (!preset.status.has_products) {
        preset.issues.push('商品なし');
      }
      if (preset.status.has_products && !preset.status.has_active_products) {
        preset.issues.push('アクティブな商品なし');
      }
      if (!preset.status.has_pickup_windows) {
        preset.issues.push('ピックアップウィンドウなし');
      }
    });

    return NextResponse.json({
      success: true,
      total_presets: presets?.length || 0,
      functional_presets: presetDetails.filter(p => p.status.is_functional).length,
      presets: presetDetails,
      summary: {
        all_presets: presets?.map(p => ({ id: p.id, name: p.preset_name })) || [],
        functional_presets: presetDetails
          .filter(p => p.status.is_functional)
          .map(p => ({ id: p.id, name: p.preset_name })),
        problematic_presets: presetDetails
          .filter(p => !p.status.is_functional)
          .map(p => ({ 
            id: p.id, 
            name: p.preset_name, 
            issues: p.issues 
          }))
      }
    });

  } catch (error) {
    console.error('Debug presets API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}