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

    console.log('GET form-settings for ID:', id);

    // 数値として解析を試行
    const numericId = parseInt(id, 10);
    
    let data, error;
    
    if (!isNaN(numericId)) {
      // まずIDで検索
      const idResult = await supabaseAdmin
        .from('form_settings')
        .select('*')
        .eq('id', numericId)
        .maybeSingle();
      
      if (idResult.data) {
        data = idResult.data;
        error = idResult.error;
      } else if (!idResult.error) {
        // IDで見つからない場合はpreset_idで検索
        const presetResult = await supabaseAdmin
          .from('form_settings')
          .select('*')
          .eq('preset_id', numericId)
          .maybeSingle();
        
        data = presetResult.data;
        error = presetResult.error;
      } else {
        error = idResult.error;
      }
    } else {
      error = { message: 'Invalid ID format' };
    }

    if (error) {
      console.error('フォーム設定取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.log('フォーム設定が見つかりません:', id);
      return NextResponse.json({ error: 'フォーム設定が見つかりません' }, { status: 404 });
    }

    console.log('フォーム設定取得成功:', data);
    return NextResponse.json({ data, success: true });
    
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

    console.log('PUT form-settings for ID:', id, 'with data:', body);

    // 確認されたデータベーススキーマに基づく更新データ
    const updateData: {
      show_price?: boolean;
      require_phone?: boolean;
      require_furigana?: boolean;
      allow_note?: boolean;
      is_enabled?: boolean;
      custom_message?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString()
    };

    // 有効なフィールドのみを追加（確認されたスキーマのみ）
    if (typeof body.show_price === 'boolean') updateData.show_price = body.show_price;
    if (typeof body.require_phone === 'boolean') updateData.require_phone = body.require_phone;
    if (typeof body.require_furigana === 'boolean') updateData.require_furigana = body.require_furigana;
    if (typeof body.allow_note === 'boolean') updateData.allow_note = body.allow_note;
    if (typeof body.is_enabled === 'boolean') updateData.is_enabled = body.is_enabled;
    if (body.custom_message !== undefined) {
      updateData.custom_message = body.custom_message || null;
    }

    console.log('Update data prepared:', updateData);

    const { data, error } = await supabaseAdmin
      .from('form_settings')
      .update(updateData)
      .eq('id', parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error('フォーム設定更新エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('フォーム設定更新成功:', data);
    return NextResponse.json({ data, success: true });
    
  } catch (err) {
    console.error('フォーム設定更新エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}