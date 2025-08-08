import { NextRequest, NextResponse } from 'next/server';
import { ReservationHistoryService } from '@/lib/services/ReservationHistoryService';

/**
 * 予約履歴検索API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const searchOptions = {
      phone_number: searchParams.get('phone') || undefined,
      user_name: searchParams.get('name') || undefined,
      date_from: searchParams.get('from') || undefined,
      date_to: searchParams.get('to') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await ReservationHistoryService.searchHistory(searchOptions);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.count,
      page: Math.floor(searchOptions.offset / searchOptions.limit) + 1,
      per_page: searchOptions.limit,
      total_pages: Math.ceil(result.count / searchOptions.limit)
    });

  } catch (error) {
    console.error('History search API error:', error);
    return NextResponse.json({
      success: false,
      error: '履歴の検索に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 履歴統計情報API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'get_stats') {
      const stats = await ReservationHistoryService.getHistoryStats();
      
      return NextResponse.json({
        success: true,
        data: stats
      });

    } else if (action === 'run_maintenance') {
      // メンテナンス処理を実行
      const completedResult = await ReservationHistoryService.moveCompletedReservationsToHistory();
      const cancelledResult = await ReservationHistoryService.moveCancelledReservationsToHistory();
      const archiveResult = await ReservationHistoryService.archiveOldHistory();

      return NextResponse.json({
        success: true,
        data: {
          completed_moved: completedResult.moved,
          completed_errors: completedResult.errors,
          cancelled_moved: cancelledResult.moved,
          cancelled_errors: cancelledResult.errors,
          archived: archiveResult.archived,
          archive_errors: archiveResult.errors
        },
        message: 'メンテナンス処理が完了しました'
      });

    } else {
      return NextResponse.json({
        success: false,
        error: '不正なアクションです'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('History maintenance API error:', error);
    return NextResponse.json({
      success: false,
      error: 'メンテナンス処理に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}