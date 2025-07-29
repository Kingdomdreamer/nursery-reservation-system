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

// 商品一覧取得
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('商品取得エラー:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('API エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 商品作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, external_id, category_id, price } = body;

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        external_id: external_id || null,
        category_id: category_id ? parseInt(category_id) : null,
        price: parseFloat(price),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('商品作成エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}