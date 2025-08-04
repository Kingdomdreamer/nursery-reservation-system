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

    // idまたはpreset_idで検索を試行
    let data, error;
    
    // まずIDで検索
    const idResult = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (idResult.data) {
      data = idResult.data;
      error = idResult.error;
    } else {
      // IDで見つからない場合はpreset_idで検索
      const presetResult = await supabaseAdmin
        .from('form_settings')
        .select('*')
        .eq('preset_id', id)
        .single();
      
      data = presetResult.data;
      error = presetResult.error;
    }

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
      require_phone,
      require_furigana,
      allow_note,
      is_enabled,
      custom_message
    } = body;

    // 実際のデータベーススキーマに合わせてフィールドを更新
    const updateData: {
      updated_at: string;
      show_price?: boolean;
      require_phone?: boolean;
      require_furigana?: boolean;
      allow_note?: boolean;
      is_enabled?: boolean;
      custom_message?: string | null;
    } = {
      updated_at: new Date().toISOString()
    };

    // 有効なフィールドのみを追加
    if (show_price !== undefined) updateData.show_price = show_price;
    if (require_phone !== undefined) updateData.require_phone = require_phone;
    if (require_furigana !== undefined) updateData.require_furigana = require_furigana;
    if (allow_note !== undefined) updateData.allow_note = allow_note;
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled;
    if (custom_message !== undefined) updateData.custom_message = custom_message;

    console.log('Form settings update data:', updateData);

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .update(updateData)
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