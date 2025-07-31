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

  constructor() {
    this.accessToken = process.env.LINE_MESSAGING_ACCESS_TOKEN!;
    this.channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET!;
  }

  // 単一ユーザーにメッセージ送信
  async pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
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
        throw new Error(`LINE API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending LINE message:', error);
      throw error;
    }
  }

  // 複数ユーザーにメッセージ送信（マルチキャスト）
  async multicastMessage(userIds: string[], messages: LineMessage[]): Promise<void> {
    if (userIds.length === 0) return;
    
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
        throw new Error(`LINE API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error sending multicast LINE message:', error);
      throw error;
    }
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

// 便利な関数をエクスポート
export async function sendReservationConfirmation(userId: string, reservationData: any) {
  const { createReservationConfirmationFlex } = await import('@/lib/line-message-templates');
  
  const message: LineFlexMessage = {
    type: 'flex',
    altText: '予約確認',
    contents: createReservationConfirmationFlex(reservationData),
  };

  await lineMessaging.pushMessage(userId, [message]);
}

export async function sendReminder(userId: string, reservationData: any) {
  const { createReminderFlex } = await import('@/lib/line-message-templates');
  
  const message: LineFlexMessage = {
    type: 'flex',
    altText: '受取リマインダー',
    contents: createReminderFlex(reservationData),
  };

  await lineMessaging.pushMessage(userId, [message]);
}

export async function sendCancellationNotice(userId: string, reservationData: any) {
  const { createCancellationFlex } = await import('@/lib/line-message-templates');
  
  const message: LineFlexMessage = {
    type: 'flex',
    altText: '予約キャンセル',
    contents: createCancellationFlex(reservationData),
  };

  await lineMessaging.pushMessage(userId, [message]);
}