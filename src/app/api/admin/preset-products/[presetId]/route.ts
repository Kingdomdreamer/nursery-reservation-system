import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  const { presetId } = await params;
  const id = Number(presetId);
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
  
  try {
    const { data, error } = await supabaseAdmin
      .from('preset_products')
      .select('product_id,is_active,display_order')
      .eq('preset_id', id);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ presetId: string }> }
) {
  const { presetId } = await params;
  const id = Number(presetId);
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
  
  try {
    const updates = await request.json();
    const { error } = await supabaseAdmin
      .from('preset_products')
      .upsert(updates.map((u: any) => ({ preset_id: id, ...u })));
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}