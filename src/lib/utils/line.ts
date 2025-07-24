import type { Reservation, NotificationType } from '@/types';

/**
 * Send LINE message using Messaging API
 */
export async function sendLineMessage(
  userId: string,
  message: string | any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/line/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userId,
        messages: Array.isArray(message) ? message : [{ type: 'text', text: message }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending LINE message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create reservation confirmation message template
 */
export function createConfirmationMessage(reservation: Reservation): any[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  const confirmationText = `【予約完了のお知らせ】

${reservation.user_name}様、ご予約ありがとうございます。
以下の内容で予約を承りました。

■ご予約内容
${reservation.product.map((product, index) => 
  `・${product}（${reservation.quantity}個）${reservation.unit_price > 0 ? `：${reservation.unit_price.toLocaleString()}円` : ''}`
).join('\n')}

${reservation.pickup_date ? `■お引き取り日\n${new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short'
})}` : ''}

${reservation.total_amount > 0 ? `■合計金額\n${reservation.total_amount.toLocaleString()}円` : ''}

${reservation.note ? `■備考\n${reservation.note}` : ''}

ご予約内容の確認・変更は以下のリンクから可能です。
${baseUrl}/reservation/${reservation.id}

ご不明点はお気軽にお問い合わせください。`;

  return [
    {
      type: 'text',
      text: confirmationText
    }
  ];
}

/**
 * Create reminder message template
 */
export function createReminderMessage(reservation: Reservation): any[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  let reminderText = '';
  
  if (reservation.pickup_date) {
    const pickupDate = new Date(reservation.pickup_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = pickupDate.toDateString() === today.toDateString();
    const isTomorrow = pickupDate.toDateString() === tomorrow.toDateString();
    
    if (isToday) {
      reminderText = `【本日の引き取りのお知らせ】

${reservation.user_name}様

本日は以下商品の引き取り日です。`;
    } else if (isTomorrow) {
      reminderText = `【明日の引き取りのお知らせ】

${reservation.user_name}様

明日は以下商品の引き取り日です。`;
    } else {
      reminderText = `【引き取り日のお知らせ】

${reservation.user_name}様

${pickupDate.toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short'
})}は以下商品の引き取り日です。`;
    }
    
    reminderText += `
${reservation.product.map(product => `・${product}`).join('\n')}

■引き取り日時
${pickupDate.toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short'
})} 10:00～18:00

ご予約内容の確認は以下のリンクから可能です。
${baseUrl}/reservation/${reservation.id}`;
  }

  return [
    {
      type: 'text',
      text: reminderText
    }
  ];
}

/**
 * Create cancellation message template
 */
export function createCancellationMessage(reservation: Reservation): any[] {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  const cancellationText = `【予約キャンセルのお知らせ】

${reservation.user_name}様

以下のご予約がキャンセルされました。

■キャンセルされた予約
${reservation.product.map(product => `・${product}`).join('\n')}

■キャンセル日時
${new Date().toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

再度ご予約される場合は以下のリンクからお願いします。
${baseUrl}/form/1

ご不明点はお気軽にお問い合わせください。`;

  return [
    {
      type: 'text',
      text: cancellationText
    }
  ];
}

/**
 * Send notification based on type
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  reservation: Reservation
): Promise<{ success: boolean; error?: string }> {
  let messages: any[];

  switch (type) {
    case 'confirmation':
      messages = createConfirmationMessage(reservation);
      break;
    case 'reminder':
      messages = createReminderMessage(reservation);
      break;
    case 'cancellation':
      messages = createCancellationMessage(reservation);
      break;
    default:
      return { success: false, error: 'Unknown notification type' };
  }

  return await sendLineMessage(userId, messages);
}

/**
 * Validate LINE User ID format
 */
export function isValidLineUserId(userId: string): boolean {
  // LINE User ID is typically 33 characters starting with 'U'
  return typeof userId === 'string' && userId.length === 33 && userId.startsWith('U');
}

/**
 * Check if running in LINE client
 */
export function isInLineClient(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return userAgent.includes('Line/');
}

/**
 * Get LIFF URL for sharing
 */
export function getLiffUrl(path = ''): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return `${baseUrl}${path}`;
}

/**
 * Format message for LINE display (handle long text)
 */
export function formatLineMessage(text: string, maxLength = 2000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}