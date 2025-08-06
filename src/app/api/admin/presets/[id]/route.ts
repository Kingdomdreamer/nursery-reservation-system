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

// プリセット詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    // プリセット基本情報
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .eq('id', id)
      .single();

    if (presetError) {
      return NextResponse.json({ error: presetError.message }, { status: 404 });
    }

    // フォーム設定
    const { data: formSettings } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', id)
      .single();

    // プリセット商品
    const { data: presetProducts } = await supabaseAdmin
      .from('preset_products')
      .select(`
        id,
        product_id,
        display_order,
        is_active,
        product:products (
          id,
          name,
          price,
          category_id,
          visible
        )
      `)
      .eq('preset_id', id)
      .order('display_order');

    return NextResponse.json({
      success: true,
      data: {
        preset,
        form_settings: formSettings,
        selected_products: presetProducts?.map(pp => pp.product_id) || []
      }
    });

  } catch (err) {
    console.error('プリセット詳細取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// プリセット更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }
    const resolvedParams = await params;
    const body = await request.json();
    const { preset_name } = body;
    const id = parseInt(resolvedParams.id);

    const { data, error } = await supabaseAdmin
      .from('product_presets')
      .update({
        preset_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('プリセット更新エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// プリセット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    // 関連データを先に削除（順序が重要）
    await supabaseAdmin.from('preset_products').delete().eq('preset_id', id);
    await supabaseAdmin.from('pickup_windows').delete().eq('preset_id', id);
    await supabaseAdmin.from('form_settings').delete().eq('preset_id', id);
    
    // プリセット本体を削除
    const { error } = await supabaseAdmin
      .from('product_presets')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('プリセット削除エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}