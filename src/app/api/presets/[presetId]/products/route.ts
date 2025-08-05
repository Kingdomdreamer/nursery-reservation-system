/**
 * プリセット商品API - 改善指示書に基づく実装
 * GET /api/presets/{presetId}/products
 * プリセット商品のみを取得する管理画面用エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  handleApiError, 
  createSuccessResponse 
} from '@/lib/utils/apiErrorHandler';
import { 
  InvalidPresetIdError,
  PresetNotFoundError,
  parsePresetProductArray 
} from '@/lib/utils/typeGuards';

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

    console.log(`[Products API] Fetching products for preset: ${id}`);

    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }

    // プリセット商品データの取得
    const { data: presetProducts, error: dbError } = await supabaseAdmin
      .from('preset_products')
      .select(`
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
      `)
      .eq('preset_id', id)
      .order('display_order');

    if (dbError) {
      console.error('[Products API] Database query error:', dbError);
      throw dbError;
    }

    // データの検証とフィルタリング
    const validProducts = (presetProducts || [])
      .filter(pp => {
        // 商品データの存在確認
        if (!pp.product || typeof pp.product !== 'object') {
          console.warn(`[Products API] Product not found for product_id: ${pp.product_id}`);
          return false;
        }
        
        // 配列の場合は最初の要素を使用（Supabaseの結合結果）
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        
        if (!product) {
          console.warn(`[Products API] Product data is empty for product_id: ${pp.product_id}`);
          return false;
        }
        
        return true;
      })
      .map(pp => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        return {
          id: pp.id,
          preset_id: pp.preset_id,
          product_id: pp.product_id,
          display_order: pp.display_order,
          is_active: pp.is_active,
          created_at: pp.created_at,
          updated_at: pp.updated_at,
          product: {
            id: product.id,
            name: product.name,
            category_id: product.category_id,
            price: product.price,
            visible: product.visible,
            created_at: product.created_at,
            updated_at: product.updated_at
          }
        };
      });

    console.log(`[Products API] Found ${validProducts.length} products for preset ${id}`);

    return createSuccessResponse(validProducts, {
      presetId: id,
      totalCount: validProducts.length,
      activeCount: validProducts.filter(p => p.is_active).length,
      visibleCount: validProducts.filter(p => p.is_active && p.product.visible).length
    });

  } catch (error) {
    console.error('[Products API] Error:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/presets/{presetId}/products
 * プリセット商品の一括更新
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

    const updates = await request.json();
    
    // データの検証
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: '更新データの形式が正しくありません' },
        { status: 400 }
      );
    }

    console.log(`[Products API] Updating ${updates.length} products for preset: ${id}`);

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

    // 更新処理
    const { error: updateError } = await supabaseAdmin
      .from('preset_products')
      .upsert(
        updates.map((update: any) => ({
          preset_id: id,
          ...update,
          updated_at: new Date().toISOString()
        }))
      );

    if (updateError) {
      console.error('[Products API] Update error:', updateError);
      throw updateError;
    }

    console.log(`[Products API] Successfully updated products for preset ${id}`);

    return createSuccessResponse(
      { message: 'プリセット商品が正常に更新されました' },
      { presetId: id, updatedCount: updates.length }
    );

  } catch (error) {
    console.error('[Products API] Update error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/presets/{presetId}/products
 * プリセット商品の追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const { presetId } = await params;
    const id = Number(presetId);
    
    if (!Number.isInteger(id) || id < 1) {
      throw new InvalidPresetIdError(presetId);
    }

    const newProducts = await request.json();
    
    // データの検証
    if (!Array.isArray(newProducts)) {
      return NextResponse.json(
        { error: '商品データの形式が正しくありません' },
        { status: 400 }
      );
    }

    console.log(`[Products API] Adding ${newProducts.length} products to preset: ${id}`);

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

    // 追加処理
    const { data: insertedProducts, error: insertError } = await supabaseAdmin
      .from('preset_products')
      .insert(
        newProducts.map((product: any) => ({
          preset_id: id,
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      )
      .select();

    if (insertError) {
      console.error('[Products API] Insert error:', insertError);
      throw insertError;
    }

    console.log(`[Products API] Successfully added ${insertedProducts?.length || 0} products to preset ${id}`);

    return createSuccessResponse(
      insertedProducts || [],
      { presetId: id, addedCount: insertedProducts?.length || 0 }
    );

  } catch (error) {
    console.error('[Products API] Add error:', error);
    return handleApiError(error);
  }
}