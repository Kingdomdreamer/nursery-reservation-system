import { NextRequest, NextResponse } from 'next/server';
import { runHistoryMaintenance } from '@/lib/services/ReservationHistoryService';
import { sendBatchReminders } from '@/lib/line-messaging';

/**
 * バッチ処理実行API
 * - 履歴メンテナンス
 * - リマインダー送信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const batchType = body.type;

    if (batchType === 'history_maintenance') {
      console.log('🔄 Running history maintenance batch...');
      
      await runHistoryMaintenance();

      return NextResponse.json({
        success: true,
        message: '履歴メンテナンスが完了しました',
        timestamp: new Date().toISOString()
      });

    } else if (batchType === 'send_reminders') {
      console.log('🔔 Running reminder batch...');
      
      const result = await sendBatchReminders();

      return NextResponse.json({
        success: true,
        data: {
          sent: result.sent,
          failed: result.failed
        },
        message: `リマインダー送信が完了しました (成功: ${result.sent}, 失敗: ${result.failed})`,
        timestamp: new Date().toISOString()
      });

    } else if (batchType === 'daily_maintenance') {
      console.log('🌅 Running daily maintenance batch...');
      
      // 両方の処理を実行
      const [historyResult, reminderResult] = await Promise.allSettled([
        runHistoryMaintenance(),
        sendBatchReminders()
      ]);

      const response: any = {
        success: true,
        message: '日次メンテナンスが完了しました',
        timestamp: new Date().toISOString(),
        results: {}
      };

      if (historyResult.status === 'fulfilled') {
        response.results.history_maintenance = 'success';
      } else {
        response.results.history_maintenance = `failed: ${historyResult.reason}`;
      }

      if (reminderResult.status === 'fulfilled') {
        response.results.reminders = reminderResult.value;
      } else {
        response.results.reminders = `failed: ${reminderResult.reason}`;
      }

      return NextResponse.json(response);

    } else {
      return NextResponse.json({
        success: false,
        error: '不正なバッチタイプです',
        available_types: ['history_maintenance', 'send_reminders', 'daily_maintenance']
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Batch processing error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'バッチ処理の実行に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * バッチ処理状況確認API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchType = searchParams.get('type');

    if (batchType === 'status') {
      // システム状態の確認
      const systemStatus = {
        server_time: new Date().toISOString(),
        available_batches: [
          {
            type: 'history_maintenance',
            description: '完了・キャンセル済み予約の履歴移行',
            recommended_schedule: '毎日午前2時'
          },
          {
            type: 'send_reminders',
            description: '翌日の予約リマインダー送信',
            recommended_schedule: '毎日午後8時'
          },
          {
            type: 'daily_maintenance',
            description: '履歴メンテナンス + リマインダー送信',
            recommended_schedule: '毎日午前2時'
          }
        ]
      };

      return NextResponse.json({
        success: true,
        data: systemStatus
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'status パラメータが必要です'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Batch status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'システム状態の確認に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}