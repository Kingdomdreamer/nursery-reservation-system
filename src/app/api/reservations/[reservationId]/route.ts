import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    // supabaseAdmin の null チェック
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available');
      return NextResponse.json(
        { error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { reservationId } = await params;

    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reservation
    });

  } catch (error) {
    console.error('予約取得エラー:', error);
    return NextResponse.json(
      { error: '予約情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}