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

// ダッシュボードデータ取得
export async function GET() {
  try {
    // 予約データを取得
    const { data: reservationData, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (reservationError) {
      console.error('予約データの取得エラー:', reservationError);
      return NextResponse.json({ error: reservationError.message }, { status: 500 });
    }

    // 統計データを計算
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayReservations = reservationData?.filter((r: any) => 
      new Date(r.created_at || '1970-01-01') >= today
    ).length || 0;

    const weekReservations = reservationData?.filter((r: any) => 
      new Date(r.created_at || '1970-01-01') >= weekAgo
    ).length || 0;

    const monthReservations = reservationData?.filter((r: any) => 
      new Date(r.created_at || '1970-01-01') >= monthAgo
    ).length || 0;

    const totalRevenue = reservationData?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0;

    const stats = {
      today_reservations: todayReservations,
      week_reservations: weekReservations,
      month_reservations: monthReservations,
      total_revenue: totalRevenue,
    };

    return NextResponse.json({ 
      reservations: reservationData || [],
      stats 
    });
  } catch (err) {
    console.error('ダッシュボードデータ取得エラー:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}