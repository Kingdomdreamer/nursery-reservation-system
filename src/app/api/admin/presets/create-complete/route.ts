import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface FormCreationRequest {
  preset_name: string;
  selected_products: number[];
  form_settings: {
    show_price: boolean;
    require_phone: boolean;
    require_furigana: boolean;
    allow_note: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const data: FormCreationRequest = await request.json();
    
    // バリデーション
    if (!data.preset_name.trim()) {
      return NextResponse.json({ error: 'プリセット名が必要です' }, { status: 400 });
    }
    
    if (data.selected_products.length === 0) {
      return NextResponse.json({ error: '商品を選択してください' }, { status: 400 });
    }

    // トランザクション開始
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .insert({
        preset_name: data.preset_name,
        description: `${data.preset_name}の予約フォーム`
      })
      .select()
      .single();

    if (presetError) throw presetError;

    // フォーム設定作成
    const { error: settingsError } = await supabaseAdmin
      .from('form_settings')
      .insert({
        preset_id: preset.id,
        ...data.form_settings,
        is_enabled: true
      });

    if (settingsError) throw settingsError;

    // 商品関連付け
    const presetProducts = data.selected_products.map((productId, index) => ({
      preset_id: preset.id,
      product_id: productId,
      display_order: index,
      is_active: true
    }));

    const { error: productsError } = await supabaseAdmin
      .from('preset_products')
      .insert(presetProducts);

    if (productsError) throw productsError;

    // デフォルトの引き取り期間作成
    const defaultPickupWindows = data.selected_products.map(productId => ({
      preset_id: preset.id,
      product_id: productId,
      pickup_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
      pickup_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間後
      dates: [],
      comment: '引き取り可能期間'
    }));

    const { error: windowsError } = await supabaseAdmin
      .from('pickup_windows')
      .insert(defaultPickupWindows);

    if (windowsError) throw windowsError;

    return NextResponse.json({
      success: true,
      data: {
        preset_id: preset.id,
        preset_name: preset.preset_name,
        products_count: data.selected_products.length
      }
    });

  } catch (error) {
    console.error('統合フォーム作成エラー:', error);
    return NextResponse.json(
      { error: 'フォーム作成に失敗しました' },
      { status: 500 }
    );
  }
}