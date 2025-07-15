import { supabase } from '../../../lib/supabase'

export interface NotificationConfig {
  lineEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  lineAccessToken?: string
  emailConfig?: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
}

export interface NotificationRecipient {
  customerId: string
  name: string
  phone?: string
  email?: string
  lineUserId?: string
}

export interface NotificationContent {
  subject: string
  message: string
  templateData?: Record<string, any>
}

export class NotificationSenderService {
  private static config: NotificationConfig = {
    lineEnabled: process.env.NODE_ENV === 'development' ? false : true,
    emailEnabled: true,
    smsEnabled: false,
    lineAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    emailConfig: {
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpUser: process.env.SMTP_USER || '',
      smtpPassword: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@nursery.com',
      fromName: process.env.FROM_NAME || '園芸用品予約システム'
    }
  }

  // 予約確定通知の送信
  static async sendReservationConfirmation(reservationId: string): Promise<{
    success: boolean
    results: {
      line?: { success: boolean; error?: string }
      email?: { success: boolean; error?: string }
      sms?: { success: boolean; error?: string }
    }
  }> {
    try {
      // 予約データを取得
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*),
          reservation_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', reservationId)
        .single()

      if (error || !reservation) {
        throw new Error('予約データが見つかりません')
      }

      const recipient: NotificationRecipient = {
        customerId: reservation.customer_id,
        name: reservation.customer?.full_name || '顧客',
        phone: reservation.customer?.phone,
        email: reservation.customer?.email,
        lineUserId: reservation.customer?.line_user_id
      }

      const content: NotificationContent = {
        subject: `【予約確定】${reservation.reservation_number}`,
        message: this.generateConfirmationMessage(reservation),
        templateData: {
          reservationNumber: reservation.reservation_number,
          customerName: recipient.name,
          reservationDate: reservation.reservation_date,
          pickupTime: `${reservation.pickup_time_start || ''} - ${reservation.pickup_time_end || ''}`.trim(),
          totalAmount: reservation.final_amount,
          items: reservation.reservation_items?.map((item: any) => ({
            name: item.product?.name,
            quantity: item.quantity,
            price: item.unit_price
          })) || []
        }
      }

      const results = await this.sendMultiChannelNotification(recipient, content)

      // 通知送信ログを記録
      await this.logNotificationSent(reservationId, 'confirmation', results)

      return {
        success: Object.values(results).some(r => r.success),
        results
      }
    } catch (error) {
      console.error('予約確定通知の送信に失敗:', error)
      return {
        success: false,
        results: {}
      }
    }
  }

  // リマインダー通知の送信
  static async sendPickupReminder(reservationId: string): Promise<{ success: boolean; results: any }> {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('id', reservationId)
        .single()

      if (error || !reservation) {
        throw new Error('予約データが見つかりません')
      }

      const recipient: NotificationRecipient = {
        customerId: reservation.customer_id,
        name: reservation.customer?.full_name || '顧客',
        phone: reservation.customer?.phone,
        email: reservation.customer?.email,
        lineUserId: reservation.customer?.line_user_id
      }

      const content: NotificationContent = {
        subject: `【受取リマインダー】${reservation.reservation_number}`,
        message: this.generateReminderMessage(reservation),
        templateData: {
          reservationNumber: reservation.reservation_number,
          customerName: recipient.name,
          reservationDate: reservation.reservation_date,
          pickupTime: `${reservation.pickup_time_start || ''} - ${reservation.pickup_time_end || ''}`.trim()
        }
      }

      const results = await this.sendMultiChannelNotification(recipient, content)

      // リマインダー送信時刻を記録
      await supabase
        .from('reservations')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', reservationId)

      await this.logNotificationSent(reservationId, 'reminder', results)

      return {
        success: Object.values(results).some(r => r.success),
        results
      }
    } catch (error) {
      console.error('リマインダー通知の送信に失敗:', error)
      return {
        success: false,
        results: {}
      }
    }
  }

  // マルチチャンネル通知送信
  private static async sendMultiChannelNotification(
    recipient: NotificationRecipient,
    content: NotificationContent
  ) {
    const results: any = {}

    // LINE通知
    if (this.config.lineEnabled && recipient.lineUserId) {
      results.line = await this.sendLineMessage(recipient.lineUserId, content)
    }

    // メール通知
    if (this.config.emailEnabled && recipient.email) {
      results.email = await this.sendEmail(recipient.email, content)
    }

    // SMS通知（将来の実装用）
    if (this.config.smsEnabled && recipient.phone) {
      results.sms = await this.sendSMS(recipient.phone, content)
    }

    return results
  }

  // LINE メッセージ送信
  private static async sendLineMessage(
    lineUserId: string,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.config.lineAccessToken) {
        return { success: false, error: 'LINE Access Token が設定されていません' }
      }

      // 開発環境では実際の送信をスキップ
      if (process.env.NODE_ENV === 'development') {
        console.log('LINE Message (Development Mode):', {
          to: lineUserId,
          message: content.message
        })
        return { success: true }
      }

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.lineAccessToken}`
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [
            {
              type: 'text',
              text: content.message
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `LINE API Error: ${error}` }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // メール送信
  private static async sendEmail(
    email: string,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 開発環境では実際の送信をスキップ
      if (process.env.NODE_ENV === 'development') {
        console.log('Email (Development Mode):', {
          to: email,
          subject: content.subject,
          message: content.message
        })
        return { success: true }
      }

      // 実際のメール送信実装（例：nodemailer使用）
      // ここでは簡略化してログ出力のみ
      console.log('Email sent to:', email, 'Subject:', content.subject)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // SMS送信（将来の実装用）
  private static async sendSMS(
    phone: string,
    content: NotificationContent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // SMS送信の実装（例：Twilio等のサービス使用）
      console.log('SMS sent to:', phone, 'Message:', content.message)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 通知送信ログの記録
  private static async logNotificationSent(
    reservationId: string,
    type: 'confirmation' | 'reminder' | 'cancellation',
    results: any
  ) {
    try {
      // 通知ログテーブルがある場合の実装
      console.log('Notification log:', {
        reservationId,
        type,
        results,
        sentAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('通知ログの記録に失敗:', error)
    }
  }

  // 予約確定メッセージの生成
  private static generateConfirmationMessage(reservation: any): string {
    const items = reservation.reservation_items?.map((item: any) => 
      `・${item.product?.name} × ${item.quantity}個`
    ).join('\n') || ''

    return `【予約確定のお知らせ】

${reservation.customer?.full_name} 様

ご予約いただきありがとうございます。
以下の内容で予約が確定いたしました。

■予約番号: ${reservation.reservation_number}
■受取日: ${new Date(reservation.reservation_date).toLocaleDateString()}
■受取時間: ${reservation.pickup_time_start || ''} - ${reservation.pickup_time_end || ''}

■ご注文内容:
${items}

■合計金額: ¥${reservation.final_amount.toLocaleString()}

受取日にお越しください。
ご不明な点がございましたらお気軽にお問い合わせください。

園芸用品予約システム`
  }

  // リマインダーメッセージの生成
  private static generateReminderMessage(reservation: any): string {
    return `【受取リマインダー】

${reservation.customer?.full_name} 様

明日は商品の受取日です。

■予約番号: ${reservation.reservation_number}
■受取日: ${new Date(reservation.reservation_date).toLocaleDateString()}
■受取時間: ${reservation.pickup_time_start || ''} - ${reservation.pickup_time_end || ''}

お忘れのないようお気をつけてお越しください。

園芸用品予約システム`
  }

  // 設定の更新
  static updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  // 通知設定の取得
  static getConfig(): NotificationConfig {
    return { ...this.config }
  }
}