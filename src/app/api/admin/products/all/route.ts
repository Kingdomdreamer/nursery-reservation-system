import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    // URLパラメータから検索条件を取得
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const includeHidden = searchParams.get('includeHidden') === 'true';

    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        price,
        category_id,
        visible,
        base_product_name,
        variation_name,
        product_code,
        created_at,
        updated_at
      `)
      .order('name');

    // 検索条件を追加
    if (search) {
      query = query.or(`name.ilike.%${search}%,base_product_name.ilike.%${search}%,product_code.ilike.%${search}%`);
    }

    // 管理画面では非表示商品も含める
    if (!includeHidden) {
      query = query.eq('visible', true);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('商品取得エラー:', error);
      throw error;
    }

    // 表示名生成ロジック
    function generateDisplayName(product: any): string {
      if (product.base_product_name && product.variation_name) {
        return `${product.base_product_name} (${product.variation_name})`;
      }
      return product.name;
    }

    // ステータスバッジ生成ロジック
    function generateStatusBadges(product: any): string[] {
      const badges: string[] = [];
      
      if (!product.visible) badges.push('非表示');
      if (product.price === 0) badges.push('サービス品');
      if (product.base_product_name && product.variation_name) badges.push('バリエーション');
      
      return badges;
    }

    // 検索用統合テキスト生成
    function generateSearchText(product: any): string {
      return [
        product.name,
        product.base_product_name,
        product.variation_name,
        product.product_code
      ].filter(Boolean).join(' ').toLowerCase();
    }

    // 商品データの整形
    const formattedProducts = (products || []).map(product => {
      const displayName = generateDisplayName(product);
      const statusBadges = generateStatusBadges(product);
      const searchText = generateSearchText(product);
      
      return {
        id: product.id,
        name: product.name,
        display_name: displayName,
        price: product.price || 0,
        product_code: product.product_code || null,
        base_product_name: product.base_product_name || null,
        variation_name: product.variation_name || null,
        category_id: product.category_id || 1,
        visible: product.visible ?? true,
        
        // 表示・検索用の追加フィールド
        search_text: searchText,
        price_display: product.price === 0 ? '無料' : `¥${(product.price || 0).toLocaleString()}`,
        status_badges: statusBadges,
        status_label: product.visible ? '表示中' : '非表示',
        
        // 商品コード表示用
        product_code_display: product.product_code ? `#${product.product_code}` : 'なし',
        
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      total: formattedProducts.length
    });

  } catch (error) {
    console.error('全商品取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '商品の取得に失敗しました' 
      },
      { status: 500 }
    );
  }
}