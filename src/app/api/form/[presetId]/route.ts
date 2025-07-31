import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/services/DatabaseService';
import { sendReservationConfirmation } from '@/lib/line-messaging';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ presetId: string }> }
) {
  const params = await context.params;
  try {
    const presetId = parseInt(params.presetId, 10);

    if (isNaN(presetId) || presetId < 1) {
      return NextResponse.json(
        { error: 'Invalid preset ID' },
        { status: 400 }
      );
    }

    const config = await DatabaseService.getFormConfig(presetId);

    if (!config) {
      return NextResponse.json(
        { error: 'Form configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error('Error in form config API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 予約データ送信処理
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ presetId: string }> }
) {
  const params = await context.params;
  try {
    const presetId = parseInt(params.presetId, 10);

    if (isNaN(presetId) || presetId < 1) {
      return NextResponse.json(
        { error: 'Invalid preset ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      user_name,
      phone,
      pickup_date,
      products,
      line_user_id,
      total_amount,
      ...additionalData
    } = body;

    // 必須フィールドの検証
    if (!user_name || !phone || !pickup_date || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 予約データをデータベースに保存
    const reservation = await DatabaseService.createReservationWithLineSupport({
      preset_id: presetId,
      user_name,
      phone,
      pickup_date,
      products,
      line_user_id,
      total_amount: total_amount || products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0),
      status: 'confirmed',
      note: additionalData.note
    });

    // LINE通知送信（LINE User IDがある場合のみ）
    if (line_user_id) {
      try {
        await sendReservationConfirmation(line_user_id, {
          id: reservation.id,
          preset_id: presetId,
          user_name,
          phone,
          pickup_date,
          products,
          total_amount: reservation.total_amount,
        });
        console.log('LINE notification sent successfully');
      } catch (lineError) {
        // LINE通知失敗は予約処理を失敗させない
        console.error('Failed to send LINE notification:', lineError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: reservation.id,
        message: '予約が完了しました',
        reservation_number: reservation.id,
      },
    });

  } catch (error) {
    console.error('Error in reservation API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}