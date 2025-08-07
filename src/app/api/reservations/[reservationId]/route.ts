import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/utils/line';
import { normalizePhoneNumber } from '@/lib/utils/helpers';
import type { 
  SelectedProduct,
  ReservationStatus,
  GenderType 
} from '@/types/database';

interface ReservationRouteParams {
  params: Promise<{
    reservationId: string;
  }>;
}

/**
 * 予約詳細取得API
 * 電話番号認証付き（指示書に従い実装）
 */
export async function GET(
  request: NextRequest,
  { params }: ReservationRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { reservationId } = await params;
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');
    const cancelToken = searchParams.get('token');

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: '予約IDが必要です' },
        { status: 400 }
      );
    }

    // 予約の取得
    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        preset_id,
        user_name,
        furigana,
        gender,
        birthday,
        phone_number,
        zip_code,
        address1,
        address2,
        comment,
        selected_products,
        pickup_date,
        total_amount,
        status,
        cancel_token,
        line_user_id,
        created_at,
        updated_at,
        product_presets!inner(preset_name)
      `)
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      console.error('[Reservation Detail API] Get error:', error);
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    // 認証チェック
    let isAuthenticated = false;
    
    // キャンセルトークンでの認証
    if (cancelToken && reservation.cancel_token === cancelToken) {
      isAuthenticated = true;
    }
    // 電話番号での認証
    else if (phoneNumber) {
      const normalizedInputPhone = normalizePhoneNumber(phoneNumber);
      const normalizedReservationPhone = normalizePhoneNumber(reservation.phone_number);
      isAuthenticated = normalizedInputPhone === normalizedReservationPhone;
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: '認証に失敗しました。電話番号またはキャンセルトークンを確認してください。' },
        { status: 401 }
      );
    }

    // レスポンスデータの整形
    const responseData = {
      id: reservation.id,
      preset_id: reservation.preset_id,
      preset_name: (reservation as any).product_presets?.preset_name || '',
      user_name: reservation.user_name,
      furigana: reservation.furigana,
      gender: reservation.gender,
      birthday: reservation.birthday,
      phone_number: reservation.phone_number,
      zip_code: reservation.zip_code,
      address1: reservation.address1,
      address2: reservation.address2,
      comment: reservation.comment,
      selected_products: reservation.selected_products,
      pickup_date: reservation.pickup_date,
      total_amount: reservation.total_amount,
      status: reservation.status,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      can_cancel: reservation.status === 'confirmed',
      can_edit: reservation.status === 'confirmed'
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('[Reservation Detail API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 予約更新API
 */
export async function PUT(
  request: NextRequest,
  { params }: ReservationRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { reservationId } = await params;
    const body = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: '予約IDが必要です' },
        { status: 400 }
      );
    }

    // 予約の存在確認とステータスチェック
    const { data: existingReservation, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select('id, status, cancel_token, phone_number, line_user_id')
      .eq('id', reservationId)
      .single();

    if (checkError || !existingReservation) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    if (existingReservation.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'この予約は編集できません' },
        { status: 400 }
      );
    }

    // 認証チェック
    let isAuthenticated = false;
    if (body.cancel_token && existingReservation.cancel_token === body.cancel_token) {
      isAuthenticated = true;
    } else if (body.phone_number) {
      const normalizedInputPhone = normalizePhoneNumber(body.phone_number);
      const normalizedReservationPhone = normalizePhoneNumber(existingReservation.phone_number);
      isAuthenticated = normalizedInputPhone === normalizedReservationPhone;
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // 更新データの準備
    const updateData: any = {};
    
    if (body.user_name !== undefined) updateData.user_name = body.user_name.trim();
    if (body.furigana !== undefined) updateData.furigana = body.furigana?.trim();
    if (body.gender !== undefined) updateData.gender = body.gender as GenderType;
    if (body.birthday !== undefined) updateData.birthday = body.birthday;
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number.trim();
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code?.trim();
    if (body.address1 !== undefined) updateData.address1 = body.address1?.trim();
    if (body.address2 !== undefined) updateData.address2 = body.address2?.trim();
    if (body.comment !== undefined) updateData.comment = body.comment?.trim();
    if (body.selected_products !== undefined) updateData.selected_products = body.selected_products as SelectedProduct[];
    if (body.pickup_date !== undefined) updateData.pickup_date = body.pickup_date;
    if (body.total_amount !== undefined) updateData.total_amount = Number(body.total_amount);

    // 予約の更新
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({
        ...updateData,
        // 互換性フィールドの更新
        phone: updateData.phone_number,
        note: updateData.comment,
        products: updateData.selected_products
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('[Reservation Update API] Error:', updateError);
      return NextResponse.json({
        success: false,
        error: '予約の更新に失敗しました'
      }, { status: 500 });
    }

    // LINE通知の送信
    if (existingReservation.line_user_id) {
      try {
        await sendNotification(
          existingReservation.line_user_id,
          'message_sent',
          {
            ...updatedReservation,
            message: '予約内容が更新されました。'
          } as any
        );
      } catch (notificationError) {
        console.error('[Reservation Update API] Notification error:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedReservation,
      message: '予約を正常に更新しました'
    });

  } catch (error) {
    console.error('[Reservation Update API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 予約キャンセルAPI
 */
export async function DELETE(
  request: NextRequest,
  { params }: ReservationRouteParams
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { reservationId } = await params;
    const { searchParams } = new URL(request.url);
    const cancelToken = searchParams.get('token');
    const phoneNumber = searchParams.get('phone');

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: '予約IDが必要です' },
        { status: 400 }
      );
    }

    // 予約の存在確認
    const { data: reservation, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select('id, status, cancel_token, phone_number, line_user_id, user_name')
      .eq('id', reservationId)
      .single();

    if (checkError || !reservation) {
      return NextResponse.json(
        { success: false, error: '予約が見つかりません' },
        { status: 404 }
      );
    }

    if (reservation.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: 'この予約はキャンセルできません' },
        { status: 400 }
      );
    }

    // 認証チェック
    let isAuthenticated = false;
    if (cancelToken && reservation.cancel_token === cancelToken) {
      isAuthenticated = true;
    } else if (phoneNumber) {
      const normalizedInputPhone = normalizePhoneNumber(phoneNumber);
      const normalizedReservationPhone = normalizePhoneNumber(reservation.phone_number);
      isAuthenticated = normalizedInputPhone === normalizedReservationPhone;
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: '認証に失敗しました' },
        { status: 401 }
      );
    }

    // 予約のキャンセル（ステータスをcancelledに更新）
    const { error: cancelError } = await supabaseAdmin
      .from('reservations')
      .update({
        status: 'cancelled' as ReservationStatus
      })
      .eq('id', reservationId);

    if (cancelError) {
      console.error('[Reservation Cancel API] Error:', cancelError);
      return NextResponse.json({
        success: false,
        error: '予約のキャンセルに失敗しました'
      }, { status: 500 });
    }

    // LINE通知の送信
    if (reservation.line_user_id) {
      try {
        await sendNotification(
          reservation.line_user_id,
          'cancellation',
          {
            ...reservation,
            message: `${reservation.user_name}様の予約をキャンセルいたしました。`,
            reservation_id: reservationId
          } as any
        );
      } catch (notificationError) {
        console.error('[Reservation Cancel API] Notification error:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '予約を正常にキャンセルしました'
    });

  } catch (error) {
    console.error('[Reservation Cancel API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}