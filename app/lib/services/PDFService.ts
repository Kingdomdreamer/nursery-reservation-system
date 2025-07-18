import { supabase } from '../../../lib/supabase'

export interface PDFReservationData {
  id: string
  reservation_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  reservation_date: string
  pickup_time_start?: string
  pickup_time_end?: string
  status: string
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
  total_amount: number
  discount_amount: number
  final_amount: number
  notes?: string
  admin_notes?: string
  created_at: string
}

export interface PDFDailyReportData {
  date: string
  total_reservations: number
  total_amount: number
  reservations: PDFReservationData[]
  summary: {
    by_status: Record<string, number>
    by_time_slot: Record<string, number>
  }
}

export class PDFService {
  // 個別予約の注文書PDF生成
  static async generateReservationPDF(reservationId: string): Promise<string> {
    try {
      // 予約データを取得
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers (
            full_name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            unit_price,
            subtotal,
            product:products (
              name,
              price
            )
          )
        `)
        .eq('id', reservationId)
        .single()

      if (error || !reservation) {
        throw new Error('予約データの取得に失敗しました')
      }

      const pdfData: PDFReservationData = {
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        customer_name: reservation.customer?.full_name || '不明',
        customer_phone: reservation.customer?.phone || '',
        customer_email: reservation.customer?.email,
        reservation_date: reservation.reservation_date,
        pickup_time_start: reservation.pickup_time_start,
        pickup_time_end: reservation.pickup_time_end,
        status: reservation.status,
        items: reservation.reservation_items?.map((item: any) => ({
          product_name: item.product?.name || '不明',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        })) || [],
        total_amount: reservation.total_amount,
        discount_amount: reservation.discount_amount,
        final_amount: reservation.final_amount,
        notes: reservation.notes,
        admin_notes: reservation.admin_notes,
        created_at: reservation.created_at
      }

      return this.generateReservationPDFHTML(pdfData)
    } catch (error) {
      console.error('PDF生成エラー:', error)
      throw new Error('PDF生成に失敗しました')
    }
  }

  // 当日の予約一覧PDF生成
  static async generateDailyReportPDF(date: string): Promise<string> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers (
            full_name,
            phone,
            email
          ),
          reservation_items (
            quantity,
            unit_price,
            subtotal,
            product:products (
              name,
              price
            )
          )
        `)
        .eq('reservation_date', date)
        .order('pickup_time_start', { ascending: true })

      if (error) {
        throw new Error('予約データの取得に失敗しました')
      }

      const pdfReservations: PDFReservationData[] = reservations?.map(reservation => ({
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        customer_name: reservation.customer?.full_name || '不明',
        customer_phone: reservation.customer?.phone || '',
        customer_email: reservation.customer?.email,
        reservation_date: reservation.reservation_date,
        pickup_time_start: reservation.pickup_time_start,
        pickup_time_end: reservation.pickup_time_end,
        status: reservation.status,
        items: reservation.reservation_items?.map((item: any) => ({
          product_name: item.product?.name || '不明',
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        })) || [],
        total_amount: reservation.total_amount,
        discount_amount: reservation.discount_amount,
        final_amount: reservation.final_amount,
        notes: reservation.notes,
        admin_notes: reservation.admin_notes,
        created_at: reservation.created_at
      })) || []

      // 統計情報を生成
      const summary = {
        by_status: pdfReservations.reduce((acc, res) => {
          acc[res.status] = (acc[res.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        by_time_slot: pdfReservations.reduce((acc, res) => {
          const timeSlot = res.pickup_time_start ? `${res.pickup_time_start}-${res.pickup_time_end}` : '時間未指定'
          acc[timeSlot] = (acc[timeSlot] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      const reportData: PDFDailyReportData = {
        date,
        total_reservations: pdfReservations.length,
        total_amount: pdfReservations.reduce((sum, res) => sum + res.final_amount, 0),
        reservations: pdfReservations,
        summary
      }

      return this.generateDailyReportPDFHTML(reportData)
    } catch (error) {
      console.error('日次レポートPDF生成エラー:', error)
      throw new Error('日次レポートPDF生成に失敗しました')
    }
  }

  // 個別予約のPDF HTML生成
  private static generateReservationPDFHTML(data: PDFReservationData): string {
    const statusLabel = {
      pending: '保留中',
      confirmed: '確定',
      ready: '準備完了',
      completed: '完了',
      cancelled: 'キャンセル'
    }[data.status] || data.status

    const pickupTime = data.pickup_time_start && data.pickup_time_end
      ? `${data.pickup_time_start} - ${data.pickup_time_end}`
      : '時間未指定'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>注文書 - ${data.reservation_number}</title>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .info-section { margin-bottom: 20px; }
    .info-section h2 { font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-item { margin-bottom: 10px; }
    .info-item label { font-weight: bold; margin-right: 10px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .items-table th { background-color: #f5f5f5; font-weight: bold; }
    .items-table .number { text-align: right; }
    .total-section { margin-top: 20px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .total-row.final { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 10px; }
    .notes { margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>注文書</h1>
    <p>予約番号: ${data.reservation_number}</p>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h2>顧客情報</h2>
      <div class="info-item">
        <label>氏名:</label>
        <span>${data.customer_name}</span>
      </div>
      <div class="info-item">
        <label>電話番号:</label>
        <span>${data.customer_phone}</span>
      </div>
      ${data.customer_email ? `
      <div class="info-item">
        <label>メールアドレス:</label>
        <span>${data.customer_email}</span>
      </div>
      ` : ''}
    </div>

    <div class="info-section">
      <h2>予約情報</h2>
      <div class="info-item">
        <label>受取日:</label>
        <span>${new Date(data.reservation_date).toLocaleDateString('ja-JP')}</span>
      </div>
      <div class="info-item">
        <label>受取時間:</label>
        <span>${pickupTime}</span>
      </div>
      <div class="info-item">
        <label>ステータス:</label>
        <span>${statusLabel}</span>
      </div>
      <div class="info-item">
        <label>予約日時:</label>
        <span>${new Date(data.created_at).toLocaleString('ja-JP')}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2>注文内容</h2>
    <table class="items-table">
      <thead>
        <tr>
          <th>商品名</th>
          <th class="number">数量</th>
          <th class="number">単価</th>
          <th class="number">小計</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
        <tr>
          <td>${item.product_name}</td>
          <td class="number">${item.quantity}</td>
          <td class="number">¥${item.unit_price.toLocaleString()}</td>
          <td class="number">¥${item.subtotal.toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span>小計:</span>
        <span>¥${data.total_amount.toLocaleString()}</span>
      </div>
      ${data.discount_amount > 0 ? `
      <div class="total-row">
        <span>割引:</span>
        <span>-¥${data.discount_amount.toLocaleString()}</span>
      </div>
      ` : ''}
      <div class="total-row final">
        <span>合計:</span>
        <span>¥${data.final_amount.toLocaleString()}</span>
      </div>
    </div>
  </div>

  ${data.notes ? `
  <div class="notes">
    <h3>お客様備考</h3>
    <p>${data.notes}</p>
  </div>
  ` : ''}

  ${data.admin_notes ? `
  <div class="notes">
    <h3>管理メモ</h3>
    <p>${data.admin_notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>ベジライス予約システム - 発行日: ${new Date().toLocaleString('ja-JP')}</p>
  </div>
</body>
</html>
    `
  }

  // 日次レポートのPDF HTML生成
  private static generateDailyReportPDFHTML(data: PDFDailyReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>日次予約レポート - ${data.date}</title>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .summary { margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .summary-item { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
    .summary-item h3 { margin-top: 0; }
    .reservations-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .reservations-table th, .reservations-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
    .reservations-table th { background-color: #f5f5f5; font-weight: bold; }
    .reservations-table .number { text-align: right; }
    .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; }
    .status-pending { background-color: #fef3c7; color: #92400e; }
    .status-confirmed { background-color: #d1fae5; color: #065f46; }
    .status-ready { background-color: #dbeafe; color: #1e40af; }
    .status-completed { background-color: #f3f4f6; color: #374151; }
    .status-cancelled { background-color: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>日次予約レポート</h1>
    <p>対象日: ${new Date(data.date).toLocaleDateString('ja-JP')}</p>
  </div>

  <div class="summary">
    <div class="summary-grid">
      <div class="summary-item">
        <h3>予約概要</h3>
        <p>総予約数: ${data.total_reservations}件</p>
        <p>総金額: ¥${data.total_amount.toLocaleString()}</p>
      </div>
      <div class="summary-item">
        <h3>ステータス別</h3>
        ${Object.entries(data.summary.by_status).map(([status, count]) => `
        <p>${status}: ${count}件</p>
        `).join('')}
      </div>
    </div>
  </div>

  <table class="reservations-table">
    <thead>
      <tr>
        <th>予約番号</th>
        <th>顧客名</th>
        <th>電話番号</th>
        <th>受取時間</th>
        <th>ステータス</th>
        <th>商品数</th>
        <th class="number">金額</th>
        <th>備考</th>
      </tr>
    </thead>
    <tbody>
      ${data.reservations.map(reservation => {
        const statusClass = `status-${reservation.status}`
        const statusLabel = {
          pending: '保留中',
          confirmed: '確定',
          ready: '準備完了',
          completed: '完了',
          cancelled: 'キャンセル'
        }[reservation.status] || reservation.status
        
        const pickupTime = reservation.pickup_time_start && reservation.pickup_time_end
          ? `${reservation.pickup_time_start}-${reservation.pickup_time_end}`
          : '未指定'

        return `
        <tr>
          <td>${reservation.reservation_number}</td>
          <td>${reservation.customer_name}</td>
          <td>${reservation.customer_phone}</td>
          <td>${pickupTime}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td>${reservation.items.length}</td>
          <td class="number">¥${reservation.final_amount.toLocaleString()}</td>
          <td>${reservation.notes || reservation.admin_notes || ''}</td>
        </tr>
        `
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>ベジライス予約システム - 発行日: ${new Date().toLocaleString('ja-JP')}</p>
  </div>
</body>
</html>
    `
  }

  // HTMLをPDFに変換（ブラウザのprint機能を使用）
  static printHTML(html: string): void {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }
}