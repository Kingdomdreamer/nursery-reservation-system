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
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const data: FormCreationRequest = await request.json();
    
    // バリデーション
    if (!data.preset_name?.trim()) {
      return NextResponse.json({ error: 'プリセット名が必要です' }, { status: 400 });
    }
    
    if (!data.selected_products || data.selected_products.length === 0) {
      return NextResponse.json({ error: '商品を選択してください' }, { status: 400 });
    }

    // 1. プリセット作成
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .insert({
        preset_name: data.preset_name,
        description: `${data.preset_name}の予約フォーム`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (presetError) {
      console.error('プリセット作成エラー:', presetError);
      throw new Error(`プリセット作成に失敗しました: ${presetError.message}`);
    }

    if (!preset) {
      throw new Error('プリセットの作成に失敗しました');
    }

    // 2. フォーム設定作成
    const { error: settingsError } = await supabaseAdmin
      .from('form_settings')
      .insert({
        preset_id: preset.id,
        show_price: data.form_settings.show_price ?? true,
        require_phone: data.form_settings.require_phone ?? true,
        require_furigana: data.form_settings.require_furigana ?? false,
        allow_note: data.form_settings.allow_note ?? true,
        is_enabled: true,
        custom_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (settingsError) {
      console.error('フォーム設定作成エラー:', settingsError);
      // プリセットを削除してロールバック
      await supabaseAdmin.from('product_presets').delete().eq('id', preset.id);
      throw new Error(`フォーム設定の作成に失敗しました: ${settingsError.message}`);
    }

    // 3. 商品関連付け
    const presetProducts = data.selected_products.map((productId, index) => ({
      preset_id: preset.id,
      product_id: productId,
      display_order: index,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: productsError } = await supabaseAdmin
      .from('preset_products')
      .insert(presetProducts);

    if (productsError) {
      console.error('商品関連付けエラー:', productsError);
      // ロールバック
      await supabaseAdmin.from('form_settings').delete().eq('preset_id', preset.id);
      await supabaseAdmin.from('product_presets').delete().eq('id', preset.id);
      throw new Error(`商品関連付けに失敗しました: ${productsError.message}`);
    }

    // 4. デフォルトの引き取り期間作成
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(18, 0, 0, 0);

    const defaultPickupWindows = data.selected_products.map(productId => ({
      preset_id: preset.id,
      product_id: productId,
      start_date: tomorrow.toISOString(),
      end_date: nextWeek.toISOString(),
      dates: [] as string[],
      price: null,
      comment: '引き取り可能期間（管理画面で調整してください）',
      variation: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: windowsError } = await supabaseAdmin
      .from('pickup_windows')
      .insert(defaultPickupWindows);

    if (windowsError) {
      console.error('引き取り期間作成エラー:', windowsError);
      // 完全ロールバック
      await supabaseAdmin.from('preset_products').delete().eq('preset_id', preset.id);
      await supabaseAdmin.from('form_settings').delete().eq('preset_id', preset.id);
      await supabaseAdmin.from('product_presets').delete().eq('id', preset.id);
      throw new Error(`引き取り期間の作成に失敗しました: ${windowsError.message}`);
    }

    console.log(`統合フォーム作成完了: プリセットID ${preset.id}, 商品数 ${data.selected_products.length}`);

    return NextResponse.json({
      success: true,
      data: {
        preset_id: preset.id,
        preset_name: preset.preset_name,
        products_count: data.selected_products.length,
        form_url: `/form/${preset.id}`
      }
    });

  } catch (error) {
    console.error('統合フォーム作成エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'フォーム作成中に予期しないエラーが発生しました';

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}