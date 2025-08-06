import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    // パラメータの安全な取得
    const { presetId } = await params;
    const id = Number(presetId);
    
    // バリデーション
    if (Number.isNaN(id) || id < 1) {
      console.error(`Invalid presetId: ${presetId}`);
      return NextResponse.json(
        { 
          error: '無効なプリセットIDです',
          code: 'INVALID_PRESET_ID',
          presetId 
        },
        { status: 400 }
      );
    }

    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    console.log(`Fetching preset products for presetId: ${id}`);

    // プリセット商品データの取得
    const { data: presetProducts, error: dbError } = await supabaseAdmin
      .from('preset_products')
      .select(`
        product_id,
        display_order,
        is_active,
        product:products(
          id,
          name,
          price,
          category_id,
          visible,
          created_at,
          updated_at
        )
      `)
      .eq('preset_id', id)
      .eq('is_active', true)
      .order('display_order');

    if (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { 
          error: 'データベースクエリエラー',
          code: 'DB_QUERY_ERROR',
          details: dbError.message 
        },
        { status: 500 }
      );
    }

    // データの整形と検証
    const validProducts = (presetProducts || [])
      .filter(pp => {
        // 商品データの存在確認
        if (!pp.product || typeof pp.product !== 'object') {
          console.warn(`Product not found for product_id: ${pp.product_id}`);
          return false;
        }
        
        // 配列の場合は最初の要素を使用
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        
        if (!product) {
          console.warn(`Product data is empty for product_id: ${pp.product_id}`);
          return false;
        }
        
        // 商品の可視性確認
        if (product.visible === false) {
          console.warn(`Product not visible: ${product.id}`);
          return false;
        }
        
        return true;
      })
      .map(pp => {
        const product = Array.isArray(pp.product) ? pp.product[0] : pp.product;
        return {
          ...product,
          display_order: pp.display_order,
          preset_product_id: pp.product_id
        };
      })
      .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

    console.log(`Found ${validProducts.length} valid products for preset ${id}`);

    return NextResponse.json({
      success: true,
      data: validProducts,
      meta: {
        presetId: id,
        totalCount: validProducts.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error in preset-products API:', error);
    return NextResponse.json(
      { 
        error: '予期しないエラーが発生しました',
        code: 'UNEXPECTED_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const { presetId } = await params;
    const id = Number(presetId);
    
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: '無効なプリセットIDです' },
        { status: 400 }
      );
    }

    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const updates = await request.json();
    
    // データの検証
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: '更新データの形式が正しくありません' },
        { status: 400 }
      );
    }

    // 更新処理
    const { error: updateError } = await supabaseAdmin
      .from('preset_products')
      .upsert(
        updates.map((update: any) => ({
          preset_id: id,
          ...update
        }))
      );

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '更新に失敗しました', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '更新が完了しました'
    });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  }
}