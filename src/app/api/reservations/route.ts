import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendNotification } from '@/lib/utils/line';
import { generateUUID, generateCancelToken } from '@/lib/utils/helpers';
import type { 
  ReservationCreateInput, 
  SelectedProduct, 
  ReservationStatus,
  GenderType 
} from '@/types/database';

/**
 * 予約作成API
 * 指示書に従い、新しいデータベース構造に対応した実装
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('[Reservation API] Request body:', body);

    // 1. 入力データのバリデーション
    const errors: string[] = [];
    
    if (!body.preset_id || isNaN(Number(body.preset_id))) {
      errors.push('プリセットIDが無効です');
    }
    
    if (!body.user_name || typeof body.user_name !== 'string' || body.user_name.trim().length === 0) {
      errors.push('お名前は必須です');
    }
    
    if (!body.phone_number || typeof body.phone_number !== 'string' || body.phone_number.trim().length === 0) {
      errors.push('電話番号は必須です');
    }
    
    if (!body.selected_products || !Array.isArray(body.selected_products) || body.selected_products.length === 0) {
      errors.push('商品を選択してください');
    }
    
    if (body.total_amount === undefined || isNaN(Number(body.total_amount)) || Number(body.total_amount) < 0) {
      errors.push('合計金額が無効です');
    }
    
    // 商品データのバリデーション
    if (body.selected_products && Array.isArray(body.selected_products)) {
      body.selected_products.forEach((product: any, index: number) => {
        if (!product.product_id || isNaN(Number(product.product_id))) {
          errors.push(`商品${index + 1}: 商品IDが無効です`);
        }
        if (!product.product_name || typeof product.product_name !== 'string') {
          errors.push(`商品${index + 1}: 商品名が無効です`);
        }
        if (!product.quantity || isNaN(Number(product.quantity)) || Number(product.quantity) < 1) {
          errors.push(`商品${index + 1}: 数量が無効です`);
        }
        if (product.unit_price === undefined || isNaN(Number(product.unit_price)) || Number(product.unit_price) < 0) {
          errors.push(`商品${index + 1}: 単価が無効です`);
        }
        if (product.total_price === undefined || isNaN(Number(product.total_price)) || Number(product.total_price) < 0) {
          errors.push(`商品${index + 1}: 小計が無効です`);
        }
      });
    }
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'バリデーションエラー',
        details: errors
      }, { status: 400 });
    }

    const presetId = Number(body.preset_id);
    
    // プリセットの存在確認
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .select('id, preset_name, is_active')
      .eq('id', presetId)
      .single();
    
    if (presetError || !preset) {
      return NextResponse.json({
        success: false,
        error: '指定されたフォームが見つかりません'
      }, { status: 404 });
    }
    
    if (!preset.is_active) {
      return NextResponse.json({
        success: false,
        error: 'このフォームは現在利用できません'
      }, { status: 400 });
    }

    // 2. 予約データのDB保存
    const reservationId = generateUUID();
    const cancelToken = generateCancelToken();
    
    const reservationData: ReservationCreateInput = {
      preset_id: presetId,
      user_name: body.user_name.trim(),
      furigana: body.furigana?.trim(),
      gender: body.gender as GenderType,
      birthday: body.birthday,
      phone_number: body.phone_number.trim(),
      zip_code: body.zip_code?.trim(),
      address1: body.address1?.trim(),
      address2: body.address2?.trim(),
      comment: body.comment?.trim(),
      selected_products: body.selected_products as SelectedProduct[],
      pickup_date: body.pickup_date,
      total_amount: Number(body.total_amount),
      line_user_id: body.line_user_id
    };

    const { data: reservation, error: createError } = await supabaseAdmin
      .from('reservations')
      .insert({
        id: reservationId,
        ...reservationData,
        status: 'confirmed' as ReservationStatus,
        cancel_token: cancelToken,
        // 互換性フィールド
        phone: reservationData.phone_number,
        note: reservationData.comment,
        products: reservationData.selected_products
      })
      .select()
      .single();

    if (createError) {
      console.error('[Reservation API] Create error:', createError);
      return NextResponse.json({
        success: false,
        error: '予約の作成に失敗しました',
        details: createError.message
      }, { status: 500 });
    }

    console.log('[Reservation API] Reservation created:', reservation.id);

    // 3. キャンセルURLの生成
    const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/cancel/${reservation.id}?token=${cancelToken}`;

    // 4. LINE通知の送信
    if (body.line_user_id) {
      try {
        const notificationResult = await sendNotification(
          body.line_user_id,
          'confirmation',
          {
            ...reservation,
            preset_name: preset.preset_name,
            cancel_url: cancelUrl
          }
        );

        if (!notificationResult.success) {
          console.error('[Reservation API] Notification failed:', notificationResult.error);
        }
      } catch (notificationError) {
        console.error('[Reservation API] Notification error:', notificationError);
        // 通知失敗は予約を失敗させない
      }
    }

    // 5. レスポンスの返却
    return NextResponse.json({
      success: true,
      data: {
        reservation: {
          id: reservation.id,
          preset_id: reservation.preset_id,
          user_name: reservation.user_name,
          phone_number: reservation.phone_number,
          total_amount: reservation.total_amount,
          status: reservation.status,
          created_at: reservation.created_at,
          cancel_url: cancelUrl
        },
        preset_name: preset.preset_name
      },
      message: '予約を正常に作成しました'
    });

  } catch (error) {
    console.error('[Reservation API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 予約一覧取得API
 * ユーザーの予約一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;
    
    // クエリビルダー
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        id,
        preset_id,
        user_name,
        phone_number,
        total_amount,
        status,
        selected_products,
        pickup_date,
        comment,
        created_at,
        updated_at,
        product_presets!inner(preset_name)
      `, { count: 'exact' })
      .eq('line_user_id', userId);
    
    // ステータスフィルタ
    if (status) {
      query = query.eq('status', status);
    }
    
    // ページング
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reservations, error, count } = await query;

    if (error) {
      console.error('[Reservation API] Get reservations error:', error);
      return NextResponse.json({
        success: false,
        error: '予約一覧の取得に失敗しました'
      }, { status: 500 });
    }

    // ページング情報
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: reservations || [],
      total: totalItems,
      page,
      per_page: limit,
      total_pages: totalPages
    });

  } catch (error) {
    console.error('[Reservation API] Get error:', error);
    return NextResponse.json({
      success: false,
      error: 'システムエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}