import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 商品一覧取得（検索・ページング対応）
export async function GET(request: NextRequest) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    
    // ページング設定
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // 検索パラメータ
    const searchName = searchParams.get('name') || '';
    const categoryId = searchParams.get('category_id') || '';
    const minPrice = searchParams.get('min_price') || '';
    const maxPrice = searchParams.get('max_price') || '';
    const variationType = searchParams.get('variation_type') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // クエリビルダー
    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' });

    // 検索条件適用
    if (searchName) {
      query = query.ilike('name', `%${searchName}%`);
    }
    
    if (categoryId) {
      query = query.eq('category_id', parseInt(categoryId));
    }
    
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }
    
    if (variationType) {
      if (variationType === 'none') {
        query = query.is('variation_type', null);
      } else {
        query = query.eq('variation_type', variationType);
      }
    }

    // ソート
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // ページング
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('商品取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ページング情報計算
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({ 
      data,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (err) {
    console.error('API エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 商品作成
export async function POST(request: NextRequest) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { name, category_id, price } = body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        category_id: category_id ? parseInt(category_id) : null,
        price: parseFloat(price),
        visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('商品作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}