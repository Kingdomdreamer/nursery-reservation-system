import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ProductCreateInput, TaxType } from '@/types/database';

/**
 * 商品一覧取得API
 * 検索・フィルタリング・ページング機能付き
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // ページング設定
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    
    // 検索・フィルタリングパラメータ
    const searchName = searchParams.get('name')?.trim() || '';
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const variationName = searchParams.get('variation_name')?.trim() || '';
    const taxType = searchParams.get('tax_type') as TaxType | null;
    const visible = searchParams.get('visible');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // 有効なソートフィールドの検証
    const validSortFields = ['name', 'price', 'created_at', 'display_order', 'variation_id'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    // クエリビルダー
    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' });

    // 検索条件適用
    if (searchName) {
      query = query.ilike('name', `%${searchName}%`);
    }
    
    if (variationName) {
      query = query.ilike('variation_name', `%${variationName}%`);
    }
    
    if (minPrice) {
      const minPriceNum = parseInt(minPrice);
      if (!isNaN(minPriceNum) && minPriceNum >= 0) {
        query = query.gte('price', minPriceNum);
      }
    }
    
    if (maxPrice) {
      const maxPriceNum = parseInt(maxPrice);
      if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
        query = query.lte('price', maxPriceNum);
      }
    }
    
    if (taxType && (taxType === '内税' || taxType === '外税')) {
      query = query.eq('tax_type', taxType);
    }
    
    if (visible !== null && visible !== undefined) {
      query = query.eq('visible', visible === 'true');
    }

    // ソート
    const ascending = sortOrder === 'asc';
    query = query.order(actualSortBy, { ascending });
    
    // 表示順でのセカンダリソート
    if (actualSortBy !== 'display_order') {
      query = query.order('display_order', { ascending: true });
    }

    // ページング適用
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('商品取得エラー:', error);
      return NextResponse.json({
        success: false,
        error: '商品の取得に失敗しました'
      }, { status: 500 });
    }

    // ページング情報計算
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({ 
      success: true,
      data: data || [],
      total: totalItems,
      page,
      per_page: limit,
      total_pages: totalPages
    });
  } catch (err) {
    console.error('商品取得API エラー:', err);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました'
    }, { status: 500 });
  }
}

/**
 * 商品作成API
 * 新しいデータベーススキーマに対応した商品作成
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // バリデーション
    const errors: string[] = [];
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('商品名は必須です');
    }
    
    if (body.name && body.name.trim().length > 255) {
      errors.push('商品名は255文字以内で入力してください');
    }
    
    if (body.price === undefined || body.price === null || isNaN(Number(body.price))) {
      errors.push('価格は必須です');
    } else if (Number(body.price) < 0) {
      errors.push('価格は0以上である必要があります');
    }
    
    if (body.tax_type && !['内税', '外税'].includes(body.tax_type)) {
      errors.push('税区分は「内税」または「外税」を選択してください');
    }
    
    if (body.variation_id && (isNaN(Number(body.variation_id)) || Number(body.variation_id) < 1)) {
      errors.push('バリエーションIDは1以上の数値である必要があります');
    }
    
    if (body.display_order && (isNaN(Number(body.display_order)) || Number(body.display_order) < 0)) {
      errors.push('表示順は0以上の数値である必要があります');
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'バリデーションエラー',
        details: errors
      }, { status: 400 });
    }

    // 商品コードの重複チェック
    if (body.product_code) {
      const { data: existingProduct } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('product_code', body.product_code)
        .single();
        
      if (existingProduct) {
        return NextResponse.json({
          success: false,
          error: '指定された商品コードは既に使用されています'
        }, { status: 400 });
      }
    }

    // 挿入データの準備
    const insertData: ProductCreateInput = {
      name: body.name.trim(),
      variation_id: body.variation_id ? Number(body.variation_id) : undefined,
      variation_name: body.variation_name?.trim() || '通常価格',
      tax_type: (body.tax_type as TaxType) || '内税',
      price: Number(body.price),
      product_code: body.product_code?.trim() || undefined,
      barcode: body.barcode?.trim() || undefined,
      visible: body.visible !== undefined ? Boolean(body.visible) : true,
      display_order: body.display_order ? Number(body.display_order) : 0
    };

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('商品作成エラー:', error);
      
      // 重複エラーの処理
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: '商品コードまたはバーコードが重複しています'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: '商品の作成に失敗しました'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data,
      message: '商品を正常に作成しました'
    });
  } catch (err) {
    console.error('商品作成API エラー:', err);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました'
    }, { status: 500 });
  }
}