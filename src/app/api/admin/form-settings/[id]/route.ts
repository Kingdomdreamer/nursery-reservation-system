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

// フォーム設定を取得（preset_idまたはsettingsのidで）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // まずpreset_idで検索
    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('preset_id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      // データが見つからない場合
      return NextResponse.json({ error: 'フォーム設定が見つかりません' }, { status: 404 });
    }

    if (error) {
      console.error('フォーム設定取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('フォーム設定取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// フォーム設定を更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const {
      show_price,
      require_address,
      enable_gender,
      enable_birthday,
      enable_furigana,
      pickup_start,
      pickup_end,
      valid_until,
      is_enabled
    } = body;

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .update({
        show_price: show_price ?? true,
        require_address: require_address ?? false,
        enable_gender: enable_gender ?? false,
        enable_birthday: enable_birthday ?? false,
        enable_furigana: enable_furigana ?? true,
        pickup_start: pickup_start || null,
        pickup_end: pickup_end || null,
        valid_until: valid_until || null,
        is_enabled: is_enabled ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('フォーム設定更新エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('フォーム設定更新エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}