import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ProductUpdateInput, TaxType } from '@/types/database';

interface ProductRouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 個別商品取得API
 */
export async function GET(
  request: NextRequest,
  { params }: ProductRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    
    if (isNaN(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: '無効な商品IDです' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('商品取得エラー:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '指定された商品が見つかりません' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: '商品の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (err) {
    console.error('商品取得API エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 商品更新API
 */
export async function PUT(
  request: NextRequest,
  { params }: ProductRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    
    if (isNaN(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: '無効な商品IDです' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const errors: string[] = [];
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        errors.push('商品名は必須です');
      } else if (body.name.trim().length > 255) {
        errors.push('商品名は255文字以内で入力してください');
      }
    }
    
    if (body.price !== undefined) {
      if (isNaN(Number(body.price)) || Number(body.price) < 0) {
        errors.push('価格は0以上である必要があります');
      }
    }
    
    if (body.tax_type !== undefined && !['内税', '外税'].includes(body.tax_type)) {
      errors.push('税区分は「内税」または「外税」を選択してください');
    }
    
    if (body.variation_id !== undefined) {
      if (isNaN(Number(body.variation_id)) || Number(body.variation_id) < 1) {
        errors.push('バリエーションIDは1以上の数値である必要があります');
      }
    }
    
    if (body.display_order !== undefined) {
      if (isNaN(Number(body.display_order)) || Number(body.display_order) < 0) {
        errors.push('表示順は0以上の数値である必要があります');
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'バリデーションエラー',
        details: errors
      }, { status: 400 });
    }

    // 商品の存在確認
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();
      
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: '指定された商品が見つかりません' },
        { status: 404 }
      );
    }

    // 商品コードの重複チェック（自分以外）
    if (body.product_code) {
      const { data: duplicateProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('product_code', body.product_code)
        .neq('id', productId)
        .single();
        
      if (duplicateProduct) {
        return NextResponse.json({
          success: false,
          error: '指定された商品コードは既に使用されています'
        }, { status: 400 });
      }
    }

    // 更新データの準備
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.variation_id !== undefined) updateData.variation_id = Number(body.variation_id);
    if (body.variation_name !== undefined) updateData.variation_name = body.variation_name.trim();
    if (body.tax_type !== undefined) updateData.tax_type = body.tax_type as TaxType;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.product_code !== undefined) updateData.product_code = body.product_code.trim() || undefined;
    if (body.barcode !== undefined) updateData.barcode = body.barcode.trim() || undefined;
    if (body.visible !== undefined) updateData.visible = Boolean(body.visible);
    if (body.display_order !== undefined) updateData.display_order = Number(body.display_order);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('商品更新エラー:', error);
      
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: '商品コードまたはバーコードが重複しています'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: '商品の更新に失敗しました'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: '商品を正常に更新しました'
    });
  } catch (err) {
    console.error('商品更新API エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 商品削除API
 */
export async function DELETE(
  request: NextRequest,
  { params }: ProductRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    
    if (isNaN(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: '無効な商品IDです' },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();
      
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: '指定された商品が見つかりません' },
        { status: 404 }
      );
    }

    // プリセットとの関連をチェック
    const { data: presetProducts, error: checkError } = await supabaseAdmin
      .from('preset_products')
      .select('preset_id')
      .eq('product_id', productId)
      .eq('is_active', true);
      
    if (checkError) {
      console.error('関連チェックエラー:', checkError);
      return NextResponse.json({
        success: false,
        error: '削除可能性の確認に失敗しました'
      }, { status: 500 });
    }

    if (presetProducts && presetProducts.length > 0) {
      const presetIds = presetProducts.map(pp => pp.preset_id);
      return NextResponse.json({
        success: false,
        error: 'この商品は現在アクティブなプリセットで使用されているため削除できません',
        details: {
          message: `プリセットID: ${presetIds.join(', ')} で使用中です`
        }
      }, { status: 400 });
    }

    // 商品削除の実行
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('商品削除エラー:', error);
      return NextResponse.json({
        success: false,
        error: '商品の削除に失敗しました'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `商品「${existingProduct.name}」を正常に削除しました`
    });
  } catch (err) {
    console.error('商品削除API エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}