import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface VariationProduct {
  name: string;
  external_id?: string | null;
  category_id?: number | null;
  price: number;
}

interface VariationInfo {
  variation_name: string;
  comment?: string | null;
}

interface VariationRequest {
  base_name: string;
  products: VariationProduct[];
  variations: VariationInfo[];
}

// バリエーション商品を一括作成
export async function POST(request: Request) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }
    const body: VariationRequest = await request.json();
    const { base_name, products, variations } = body;

    // バリデーション
    if (!base_name?.trim()) {
      return NextResponse.json({ error: '基本商品名は必須です' }, { status: 400 });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: '商品データが必要です' }, { status: 400 });
    }

    if (!Array.isArray(variations) || variations.length !== products.length) {
      return NextResponse.json({ error: 'バリエーション情報が不正です' }, { status: 400 });
    }

    // 各商品データのバリデーション
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const variation = variations[i];

      if (!product.name?.trim()) {
        return NextResponse.json({ 
          error: `商品${i + 1}の商品名は必須です` 
        }, { status: 400 });
      }

      if (typeof product.price !== 'number' || product.price < 0) {
        return NextResponse.json({ 
          error: `商品${i + 1}の価格が不正です` 
        }, { status: 400 });
      }

      if (!variation.variation_name?.trim()) {
        return NextResponse.json({ 
          error: `商品${i + 1}のバリエーション名は必須です` 
        }, { status: 400 });
      }
    }

    // 重複チェック（既存商品名との重複）
    const productNames = products.map(p => p.name);
    const { data: existingProducts, error: checkError } = await supabaseAdmin
      .from('products')
      .select('name')
      .in('name', productNames);

    if (checkError) {
      console.error('既存商品チェックエラー:', checkError);
      return NextResponse.json({ error: 'データベースエラー' }, { status: 500 });
    }

    if (existingProducts && existingProducts.length > 0) {
      const duplicateNames = existingProducts.map(p => p.name);
      return NextResponse.json({ 
        error: `以下の商品名が既に存在します: ${duplicateNames.join(', ')}`,
        duplicates: duplicateNames
      }, { status: 409 });
    }

    // データベースに挿入
    const insertData = products.map((product, index) => ({
      name: product.name,
      external_id: product.external_id || null,
      category_id: product.category_id || null,
      price: product.price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: createdProducts, error: insertError } = await supabaseAdmin
      .from('products')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('商品作成エラー:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // レスポンス用のデータを整形
    const responseData = createdProducts?.map((product, index) => ({
      ...product,
      base_name: base_name,
      variation_info: variations[index]
    }));

    return NextResponse.json({ 
      success: true,
      data: responseData,
      message: `${createdProducts?.length || 0}個のバリエーション商品を作成しました`,
      base_name: base_name
    });

  } catch (err) {
    console.error('バリエーション商品作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// バリエーション商品グループの取得（将来の拡張用）
export async function GET(request: Request) {
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
    const baseName = searchParams.get('base_name');

    if (!baseName) {
      return NextResponse.json({ error: '基本商品名が必要です' }, { status: 400 });
    }

    // 基本商品名を含む商品を検索
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .ilike('name', `${baseName}（%）`)
      .order('name');

    if (error) {
      console.error('バリエーション商品検索エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // バリエーション情報を抽出
    const variationProducts = data?.map(product => {
      const match = product.name.match(/^(.+?)（(.+?)）$/);
      return {
        ...product,
        base_name: match ? match[1] : product.name,
        variation_name: match ? match[2] : '',
        is_variation: !!match
      };
    });

    return NextResponse.json({ 
      success: true,
      data: variationProducts,
      base_name: baseName,
      count: variationProducts?.length || 0
    });

  } catch (err) {
    console.error('バリエーション商品取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}