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

// フォーム設定を作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      preset_id,
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

    if (!preset_id) {
      return NextResponse.json({ error: 'プリセットIDは必須です' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .insert({
        preset_id,
        show_price: show_price ?? true,
        require_address: require_address ?? false,
        enable_gender: enable_gender ?? false,
        enable_birthday: enable_birthday ?? false,
        enable_furigana: enable_furigana ?? true,
        pickup_start: pickup_start || null,
        pickup_end: pickup_end || null,
        valid_until: valid_until || null,
        is_enabled: is_enabled ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('フォーム設定作成エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('フォーム設定作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}