interface LineTextMessage {
  type: 'text';
  text: string;
}

interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: any;
}

type LineMessage = LineTextMessage | LineFlexMessage;

class LineMessagingService {
  private accessToken: string;
  private channelSecret: string;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1秒

  constructor() {
    this.accessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN!;
    this.channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET!;
  }

  // リトライロジック付きのAPI呼び出し
  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.warn(`LINE API call failed, retrying in ${this.RETRY_DELAY}ms. Retries left: ${retries}`);
        await this.delay(this.RETRY_DELAY);
        return this.retryApiCall(apiCall, retries - 1);
      }
      throw error;
    }
  }

  // リトライすべきエラーかどうか判定
  private shouldRetry(error: any): boolean {
    if (error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503')) {
      return true; // サーバーエラーはリトライ
    }
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true; // ネットワークエラーはリトライ
    }
    return false;
  }

  // 遅延関数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 単一ユーザーにメッセージ送信（リトライ機能付き）
  async pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
    return this.retryApiCall(async () => {
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            to: userId,
            messages: messages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`LINE API Error: ${response.status} - ${errorText}`);
          (error as any).status = response.status;
          throw error;
        }

        console.log(`✅ LINE message sent successfully to user: ${userId}`);
      } catch (error) {
        console.error('❌ Error sending LINE message:', error);
        throw error;
      }
    });
  }

  // 複数ユーザーにメッセージ送信（マルチキャスト、リトライ機能付き）
  async multicastMessage(userIds: string[], messages: LineMessage[]): Promise<void> {
    if (userIds.length === 0) return;
    
    return this.retryApiCall(async () => {
      try {
        const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            to: userIds,
            messages: messages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`LINE API Error: ${response.status} - ${errorText}`);
          (error as any).status = response.status;
          throw error;
        }

        console.log(`✅ LINE multicast message sent successfully to ${userIds.length} users`);
      } catch (error) {
        console.error('❌ Error sending multicast LINE message:', error);
        throw error;
      }
    });
  }

  // Webhook署名検証
  verifySignature(body: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('SHA256', this.channelSecret)
      .update(body, 'utf8')
      .digest('base64');
    
    return signature === expectedSignature;
  }
}

export const lineMessaging = new LineMessagingService();

// 便利な関数をエクスポート（エラーハンドリング強化）
export async function sendReservationConfirmation(userId: string, reservationData: any): Promise<{success: boolean, error?: string}> {
  try {
    const { createReservationConfirmationFlex } = await import('@/lib/line-message-templates');
    
    const message: LineFlexMessage = {
      type: 'flex',
      altText: `✅ ${reservationData.user_name}様の予約確認 - 合計¥${reservationData.total_amount.toLocaleString()}`,
      contents: createReservationConfirmationFlex(reservationData),
    };

    await lineMessaging.pushMessage(userId, [message]);
    
    // 通知ログに記録
    await logNotification(userId, 'reservation_confirmation', reservationData);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send reservation confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendReminder(userId: string, reservationData: any): Promise<{success: boolean, error?: string}> {
  try {
    const { createReminderFlex } = await import('@/lib/line-message-templates');
    
    const message: LineFlexMessage = {
      type: 'flex',
      altText: `🔔 ${reservationData.user_name}様 - 明日は受取日です！`,
      contents: createReminderFlex(reservationData),
    };

    await lineMessaging.pushMessage(userId, [message]);
    await logNotification(userId, 'pickup_reminder', reservationData);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send reminder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendCancellationNotice(userId: string, reservationData: any): Promise<{success: boolean, error?: string}> {
  try {
    const { createCancellationFlex } = await import('@/lib/line-message-templates');
    
    const message: LineFlexMessage = {
      type: 'flex',
      altText: `❌ ${reservationData.user_name}様の予約がキャンセルされました`,
      contents: createCancellationFlex(reservationData),
    };

    await lineMessaging.pushMessage(userId, [message]);
    await logNotification(userId, 'cancellation_notice', reservationData);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send cancellation notice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 通知ログ記録関数
async function logNotification(userId: string, type: string, data: any): Promise<void> {
  try {
    const response = await fetch('/api/admin/notification-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        type: type,
        message: {
          reservation_id: data.id,
          user_name: data.user_name,
          total_amount: data.total_amount,
          timestamp: new Date().toISOString()
        },
        sent_at: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.warn('Failed to log notification, but continuing...');
    }
  } catch (error) {
    console.warn('Failed to log notification:', error);
  }
}

// バッチリマインダー送信（翌日の予約に対して）
export async function sendBatchReminders(): Promise<{sent: number, failed: number}> {
  try {
    console.log('🔔 Starting batch reminder sending...');
    
    // 明日の予約を取得
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const response = await fetch(`/api/admin/reservations?pickup_date=${tomorrowStr}&status=confirmed`);
    const data = await response.json();
    
    if (!data.success || !data.reservations) {
      console.log('No reservations found for tomorrow');
      return { sent: 0, failed: 0 };
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const reservation of data.reservations) {
      if (reservation.line_user_id) {
        const result = await sendReminder(reservation.line_user_id, reservation);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
        
        // APIレート制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Batch reminders completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
    
  } catch (error) {
    console.error('❌ Error in batch reminder sending:', error);
    return { sent: 0, failed: 0 };
  }
}