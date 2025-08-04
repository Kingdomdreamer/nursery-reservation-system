import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// 全プリセット商品一覧を取得（GET /api/admin/preset-products）
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase 管理クライアントが利用できません' },
      { status: 500 }
    );
  }
  const { data, error } = await supabaseAdmin
    .from('preset_products')
    .select('preset_id,product_id,is_active,display_order')
    .order('preset_id')
    .order('display_order');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}