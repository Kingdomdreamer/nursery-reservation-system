import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// フォーム設定一覧取得
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    console.log('GET all form-settings');

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('フォーム設定一覧取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('フォーム設定一覧取得成功:', data?.length || 0, 'records');
    return NextResponse.json({ data: data || [], success: true });
    
  } catch (err) {
    console.error('フォーム設定一覧取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// フォーム設定作成
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const body = await request.json();
    console.log('POST form-settings with data:', body);

    // 確認されたデータベーススキーマに基づく挿入データ
    const insertData: {
      preset_id: number;
      show_price?: boolean;
      require_phone?: boolean;
      require_furigana?: boolean;
      allow_note?: boolean;
      is_enabled?: boolean;
      custom_message?: string | null;
      enable_birthday?: boolean;
      enable_gender?: boolean;
      require_address?: boolean;
      enable_furigana?: boolean;
      created_at: string;
      updated_at: string;
    } = {
      preset_id: body.preset_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // preset_idが必須
    if (!body.preset_id || typeof body.preset_id !== 'number') {
      return NextResponse.json({ error: 'preset_id is required' }, { status: 400 });
    }

    // デフォルト値を設定（確認されたスキーマに基づく）
    insertData.show_price = body.show_price !== undefined ? body.show_price : true;
    insertData.require_phone = body.require_phone !== undefined ? body.require_phone : true;
    insertData.require_furigana = body.require_furigana !== undefined ? body.require_furigana : true;
    insertData.allow_note = body.allow_note !== undefined ? body.allow_note : true;
    insertData.is_enabled = body.is_enabled !== undefined ? body.is_enabled : true;
    insertData.custom_message = body.custom_message || null;
    
    // Legacy fields for compatibility
    if (body.enable_birthday !== undefined) insertData.enable_birthday = body.enable_birthday;
    if (body.enable_gender !== undefined) insertData.enable_gender = body.enable_gender;
    if (body.require_address !== undefined) insertData.require_address = body.require_address;
    if (body.enable_furigana !== undefined) insertData.enable_furigana = body.enable_furigana;

    console.log('Insert data prepared:', insertData);

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('フォーム設定作成エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('フォーム設定作成成功:', data);
    return NextResponse.json({ data, success: true });
    
  } catch (err) {
    console.error('フォーム設定作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}