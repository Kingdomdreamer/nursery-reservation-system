import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { id: productId } = await params;
    const { visible } = await request.json();

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({ 
        visible: visible,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('商品ステータス更新エラー:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('商品ステータス更新エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'ステータス更新に失敗しました' 
      },
      { status: 500 }
    );
  }
}