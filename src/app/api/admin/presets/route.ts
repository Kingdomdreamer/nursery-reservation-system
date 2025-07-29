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

// プリセット一覧取得
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('プリセット取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('API エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// プリセット作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preset_name, mode, source_preset_id } = body;

    // プリセット作成
    const { data: newPreset, error: createError } = await supabaseAdmin
      .from('product_presets')
      .insert({
        preset_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 複製の場合は設定をコピー
    if (mode === 'duplicate' && source_preset_id) {
      await duplicatePresetSettings(source_preset_id, newPreset.id);
    } else {
      // 新規作成の場合はデフォルト設定を作成
      await createDefaultFormSettings(newPreset.id);
    }

    return NextResponse.json({ data: newPreset });
  } catch (err) {
    console.error('プリセット作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function duplicatePresetSettings(sourceId: number, targetId: number) {
  // フォーム設定をコピー
  const { data: formSettings } = await supabaseAdmin
    .from('form_settings')
    .select('*')
    .eq('preset_id', sourceId)
    .single();

  if (formSettings) {
    const { id, preset_id, created_at, updated_at, ...settingsData } = formSettings;
    await supabaseAdmin
      .from('form_settings')
      .insert({
        ...settingsData,
        preset_id: targetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  // 引き取り期間設定をコピー
  const { data: pickupWindows } = await supabaseAdmin
    .from('pickup_windows')
    .select('*')
    .eq('preset_id', sourceId);

  if (pickupWindows && pickupWindows.length > 0) {
    const newWindows = pickupWindows.map(window => {
      const { id, preset_id, created_at, updated_at, ...windowData } = window;
      return {
        ...windowData,
        preset_id: targetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    await supabaseAdmin
      .from('pickup_windows')
      .insert(newWindows);
  }
}

async function createDefaultFormSettings(presetId: number) {
  await supabaseAdmin
    .from('form_settings')
    .insert({
      preset_id: presetId,
      show_price: true,
      require_address: false,
      enable_gender: false,
      enable_birthday: false,
      enable_furigana: true,
      is_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
}