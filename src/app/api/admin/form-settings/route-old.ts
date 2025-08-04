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
      require_phone,
      require_furigana,
      allow_note,
      is_enabled,
      custom_message
    } = body;

    if (!preset_id) {
      return NextResponse.json({ error: 'プリセットIDは必須です' }, { status: 400 });
    }

    // 実際のデータベーススキーマに合わせて作成
    const insertData = {
      preset_id,
      show_price: show_price ?? true,
      require_phone: require_phone ?? true,
      require_furigana: require_furigana ?? true,
      allow_note: allow_note ?? true,
      is_enabled: is_enabled ?? true,
      custom_message: custom_message || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Form settings insert data:', insertData);

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .insert(insertData)
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