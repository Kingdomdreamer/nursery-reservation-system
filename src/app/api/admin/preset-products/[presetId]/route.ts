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

// プリセットに関連付けられた商品を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const resolvedParams = await params;
    const presetId = parseInt(resolvedParams.presetId);

    if (isNaN(presetId)) {
      return NextResponse.json({ error: '無効なプリセットIDです' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('preset_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('preset_id', presetId)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('プリセット商品取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'プリセット商品が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('プリセット商品取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// プリセットの商品関連付けを更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  try {
    const resolvedParams = await params;
    const presetId = parseInt(resolvedParams.presetId);
    const body = await request.json();
    const { products } = body;

    if (isNaN(presetId)) {
      return NextResponse.json({ error: '無効なプリセットIDです' }, { status: 400 });
    }

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: '商品データが無効です' }, { status: 400 });
    }

    // トランザクション的に処理
    // 1. 既存の関連付けを全て削除
    const { error: deleteError } = await supabaseAdmin
      .from('preset_products')
      .delete()
      .eq('preset_id', presetId);

    if (deleteError) {
      console.error('既存関連付け削除エラー:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 2. 新しい関連付けを挿入（商品が選択されている場合のみ）
    if (products.length > 0) {
      const insertData = products.map((product: any, index: number) => ({
        preset_id: presetId,
        product_id: product.product_id,
        display_order: product.display_order || index + 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error: insertError } = await supabaseAdmin
        .from('preset_products')
        .insert(insertData)
        .select();

      if (insertError) {
        console.error('新規関連付け挿入エラー:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    } else {
      return NextResponse.json({ data: [] }); // 商品が選択されていない場合
    }

  } catch (err) {
    console.error('プリセット商品更新エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}