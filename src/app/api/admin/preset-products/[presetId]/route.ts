import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { presetId: string } }
) {
  const id = Number(params.presetId);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: '無効なプリセットIDです' },
      { status: 400 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase 管理クライアントが利用できません' },
      { status: 500 }
    );
  }
  const { data, error } = await supabaseAdmin
    .from('preset_products')
    .select('product_id,is_active,display_order')
    .eq('preset_id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { presetId: string } }
) {
  const id = Number(params.presetId);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: '無効なプリセットIDです' },
      { status: 400 }
    );
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase 管理クライアントが利用できません' },
      { status: 500 }
    );
  }
  const updates = await request.json(); // [{ product_id,… }, …]
  const { error } = await supabaseAdmin
    .from('preset_products')
    .upsert(updates.map((u: any) => ({ preset_id: id, ...u })));
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ updated: true });
}