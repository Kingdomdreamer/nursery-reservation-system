import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 全プリセット商品を取得
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('preset_products')
      .select(`
        *,
        product:products(*),
        preset:product_presets(*)
      `)
      .eq('is_active', true)
      .order('preset_id')
      .order('display_order');

    if (error) {
      console.error('プリセット商品取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('プリセット商品取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}