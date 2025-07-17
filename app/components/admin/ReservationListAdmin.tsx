'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Reservation, Customer, ReservationItem } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { NotificationSenderService } from '../../lib/services/NotificationSenderService'
import { PDFService } from '../../lib/services/PDFService'

export default function ReservationListAdmin() {
  const { showSuccess, showError } = useToast()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*),
          reservation_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('予約データの取得に失敗しました:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          ...(newStatus === 'confirmed' && { confirmation_sent_at: new Date().toISOString() })
        })
        .eq('id', reservationId)

      if (error) throw error

      setReservations(reservations.map(reservation =>
        reservation.id === reservationId
          ? { ...reservation, status: newStatus as Reservation['status'] }
          : reservation
      ))

      // 通知送信処理をここに追加
      if (newStatus === 'confirmed') {
        await sendConfirmationNotification(reservationId)
      }
      
      showSuccess('ステータスを更新しました', '予約ステータスが正常に更新されました。')
    } catch (error: any) {
      console.error('ステータスの更新に失敗しました:', error)
      showError('ステータス更新に失敗しました', error?.message || 'ステータスの更新中にエラーが発生しました。')
    }
  }

  const sendConfirmationNotification = async (reservationId: string) => {
    try {
      showSuccess('通知送信中...', '予約確定通知を送信しています')
      
      const result = await NotificationSenderService.sendReservationConfirmation(reservationId)
      
      if (result.success) {
        let successMessage = '予約確定通知を送信しました'
        const sentChannels = []
        
        if (result.results.line?.success) sentChannels.push('LINE')
        if (result.results.email?.success) sentChannels.push('メール')
        if (result.results.sms?.success) sentChannels.push('SMS')
        
        if (sentChannels.length > 0) {
          successMessage += ` (${sentChannels.join('、')})`
        }
        
        showSuccess('通知送信完了', successMessage)
      } else {
        const errors = []
        if (result.results.line?.error) errors.push(`LINE: ${result.results.line.error}`)
        if (result.results.email?.error) errors.push(`メール: ${result.results.email.error}`)
        if (result.results.sms?.error) errors.push(`SMS: ${result.results.sms.error}`)
        
        showError('通知送信に失敗しました', errors.join('\n') || '通知の送信中にエラーが発生しました')
      }
    } catch (error: any) {
      console.error('通知送信エラー:', error)
      showError('通知送信エラー', error.message || '通知の送信中にエラーが発生しました')
    }
  }

  const sendReminderNotification = async (reservationId: string) => {
    try {
      showSuccess('リマインダー送信中...', '受取リマインダーを送信しています')
      
      const result = await NotificationSenderService.sendPickupReminder(reservationId)
      
      if (result.success) {
        let successMessage = '受取リマインダーを送信しました'
        const sentChannels = []
        
        if (result.results.line?.success) sentChannels.push('LINE')
        if (result.results.email?.success) sentChannels.push('メール')
        if (result.results.sms?.success) sentChannels.push('SMS')
        
        if (sentChannels.length > 0) {
          successMessage += ` (${sentChannels.join('、')})`
        }
        
        showSuccess('リマインダー送信完了', successMessage)
      } else {
        const errors = []
        if (result.results.line?.error) errors.push(`LINE: ${result.results.line.error}`)
        if (result.results.email?.error) errors.push(`メール: ${result.results.email.error}`)
        if (result.results.sms?.error) errors.push(`SMS: ${result.results.sms.error}`)
        
        showError('リマインダー送信に失敗しました', errors.join('\n') || 'リマインダーの送信中にエラーが発生しました')
      }
    } catch (error: any) {
      console.error('リマインダー送信エラー:', error)
      showError('リマインダー送信エラー', error.message || 'リマインダーの送信中にエラーが発生しました')
    }
  }

  const generateReservationPDF = async (reservationId: string) => {
    try {
      showSuccess('PDF生成中...', '注文書PDFを生成しています')
      
      const pdfHTML = await PDFService.generateReservationPDF(reservationId)
      PDFService.printHTML(pdfHTML)
      
      showSuccess('PDF生成完了', '注文書PDFを生成しました')
    } catch (error: any) {
      console.error('PDF生成エラー:', error)
      showError('PDF生成エラー', error.message || 'PDFの生成中にエラーが発生しました')
    }
  }

  const generateDailyReportPDF = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      showSuccess('PDF生成中...', `${today}の予約レポートを生成しています`)
      
      const pdfHTML = await PDFService.generateDailyReportPDF(today)
      PDFService.printHTML(pdfHTML)
      
      showSuccess('PDF生成完了', '当日の予約レポートを生成しました')
    } catch (error: any) {
      console.error('PDF生成エラー:', error)
      showError('PDF生成エラー', error.message || 'PDFの生成中にエラーが発生しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '保留中', className: 'bg-warning-subtle text-warning' },
      confirmed: { label: '確定', className: 'bg-success-subtle text-success' },
      ready: { label: '準備完了', className: 'bg-info-subtle text-info' },
      completed: { label: '完了', className: 'bg-secondary-subtle text-secondary' },
      cancelled: { label: 'キャンセル', className: 'bg-danger-subtle text-danger' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`badge ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // 決済関連機能は実装対象外のため削除

  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter
    const matchesDate = !dateFilter || reservation.reservation_date === dateFilter
    const matchesSearch = !searchTerm || 
      reservation.reservation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer?.phone.includes(searchTerm)
    
    return matchesStatus && matchesDate && matchesSearch
  })

  const openDetailModal = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="h2 fw-bold text-dark">予約一覧</h2>
            <div className="d-flex gap-3">
              <button className="btn btn-success">
                <i className="bi bi-file-earmark-plus me-2"></i>
                新規予約追加
              </button>
              <button 
                onClick={generateDailyReportPDF}
                className="btn btn-outline-primary"
              >
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                当日レポートPDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-medium">
                    ステータス
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="all">すべてのステータス</option>
                    <option value="pending">保留中</option>
                    <option value="confirmed">確定</option>
                    <option value="ready">準備完了</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
                <div className="col-lg-3 col-md-6">
                  <label className="form-label fw-medium">
                    受取日
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="col-lg-4 col-md-6">
                  <label className="form-label fw-medium">
                    検索
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="予約番号、顧客名、電話番号で検索"
                    className="form-control"
                  />
                </div>
                <div className="col-lg-2 col-md-6 d-flex align-items-end">
                  <div className="text-muted small">
                    {filteredReservations.length} 件の予約
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 予約リスト */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            {/* デスクトップ用テーブル表示 */}
            <div className="d-none d-lg-block">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-medium text-muted text-uppercase small">
                        予約情報
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        顧客情報
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        受取日時
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        金額
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        ステータス
                      </th>
                      <th className="fw-medium text-muted text-uppercase small">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-3 py-3">
                          <div>
                            <div className="fw-medium text-dark">
                              {reservation.reservation_number}
                            </div>
                            <div className="small text-muted">
                              作成: {new Date(reservation.created_at).toLocaleDateString()}
                            </div>
                            {reservation.notes && (
                              <div className="small text-muted mt-1">
                                <i className="bi bi-file-earmark-text me-1"></i>
                                {reservation.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <div className="fw-medium text-dark">
                              {reservation.customer?.full_name}
                            </div>
                            <div className="small text-muted">
                              <i className="bi bi-telephone me-1"></i>
                              {reservation.customer?.phone}
                            </div>
                            {reservation.customer?.email && (
                              <div className="small text-muted">
                                <i className="bi bi-envelope me-1"></i>
                                {reservation.customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-dark">
                            {new Date(reservation.reservation_date).toLocaleDateString()}
                          </div>
                          {reservation.pickup_time_start && reservation.pickup_time_end && (
                            <div className="small text-muted">
                              {reservation.pickup_time_start} - {reservation.pickup_time_end}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="fw-medium text-dark">
                            ¥{reservation.final_amount.toLocaleString()}
                          </div>
                          {reservation.discount_amount && reservation.discount_amount > 0 && (
                            <div className="small text-success">
                              割引: -¥{reservation.discount_amount.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={reservation.status}
                            onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                            className="form-select form-select-sm"
                          >
                            <option value="pending">保留中</option>
                            <option value="confirmed">確定</option>
                            <option value="ready">準備完了</option>
                            <option value="completed">完了</option>
                            <option value="cancelled">キャンセル</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="d-flex gap-1">
                            <button
                              onClick={() => openDetailModal(reservation)}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className="bi bi-eye me-1"></i>
                              詳細
                            </button>
                            <button
                              onClick={() => generateReservationPDF(reservation.id)}
                              className="btn btn-outline-secondary btn-sm"
                              title="注文書PDFを生成"
                            >
                              <i className="bi bi-file-earmark-pdf"></i>
                            </button>
                            {reservation.status === 'confirmed' && !reservation.reminder_sent_at && (
                              <button
                                onClick={() => sendReminderNotification(reservation.id)}
                                className="btn btn-outline-warning btn-sm"
                                title="受取リマインダーを送信"
                              >
                                <i className="bi bi-bell"></i>
                              </button>
                            )}
                            <button className="btn btn-outline-primary btn-sm">
                              <i className="bi bi-pencil"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* モバイル・タブレット用カード表示 */}
            <div className="d-lg-none">
              <div className="card-body p-0">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="fw-medium text-dark">
                          {reservation.reservation_number}
                        </div>
                        <div className="text-muted">
                          {reservation.customer?.full_name}
                        </div>
                      </div>
                      <div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    </div>
                
                    <div className="row g-3 mb-3 small">
                      <div className="col-6">
                        <span className="text-muted">受取日:</span>
                        <div className="fw-medium">
                          {new Date(reservation.reservation_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">金額:</span>
                        <div className="fw-medium">
                          ¥{reservation.final_amount.toLocaleString()}
                        </div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">電話:</span>
                        <div>{reservation.customer?.phone}</div>
                      </div>
                      <div className="col-6">
                        <span className="text-muted">作成:</span>
                        <div>{new Date(reservation.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1 me-3">
                        <select
                          value={reservation.status}
                          onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                          className="form-select form-select-sm"
                        >
                          <option value="pending">保留中</option>
                          <option value="confirmed">確定</option>
                          <option value="ready">準備完了</option>
                          <option value="completed">完了</option>
                          <option value="cancelled">キャンセル</option>
                        </select>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          onClick={() => openDetailModal(reservation)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => generateReservationPDF(reservation.id)}
                          className="btn btn-outline-secondary btn-sm"
                          title="注文書PDFを生成"
                        >
                          <i className="bi bi-file-earmark-pdf"></i>
                        </button>
                        {reservation.status === 'confirmed' && !reservation.reminder_sent_at && (
                          <button
                            onClick={() => sendReminderNotification(reservation.id)}
                            className="btn btn-outline-warning btn-sm"
                            title="受取リマインダーを送信"
                          >
                            <i className="bi bi-bell"></i>
                          </button>
                        )}
                        <button className="btn btn-outline-primary btn-sm">
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="mt-2 small text-muted bg-light p-2 rounded">
                        <i className="bi bi-file-earmark-text me-1"></i>
                        {reservation.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="text-center py-5">
              <i className="bi bi-calendar-x text-muted" style={{ fontSize: '4rem' }}></i>
              <h3 className="h5 fw-medium text-dark mt-3 mb-2">予約が見つかりません</h3>
              <p className="text-muted">検索条件を変更するか、新しい予約を追加してください。</p>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {showDetailModal && selectedReservation && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">予約詳細</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">

                <div className="row g-4">
                  {/* 基本情報 */}
                  <div className="col-12">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">予約番号</label>
                        <div className="text-dark">{selectedReservation.reservation_number}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">ステータス</label>
                        <div>{getStatusBadge(selectedReservation.status)}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">受取日</label>
                        <div className="text-dark">
                          {new Date(selectedReservation.reservation_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 顧客情報 */}
                  <div className="col-12">
                    <h6 className="fw-medium text-dark mb-3">顧客情報</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-medium">氏名</label>
                        <div className="text-dark">{selectedReservation.customer?.full_name}</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium">電話番号</label>
                        <div className="text-dark">{selectedReservation.customer?.phone}</div>
                      </div>
                      {selectedReservation.customer?.email && (
                        <div className="col-md-6">
                          <label className="form-label fw-medium">メールアドレス</label>
                          <div className="text-dark">{selectedReservation.customer.email}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 注文商品 */}
                  <div className="col-12">
                    <h6 className="fw-medium text-dark mb-3">注文商品</h6>
                    <div className="table-responsive">
                      <table className="table table-borderless">
                        <tbody>
                          {selectedReservation.reservation_items?.map((item, index) => (
                            <tr key={index} className="border-bottom">
                              <td className="ps-0">
                                <div className="fw-medium">{item.product?.name}</div>
                                <div className="small text-muted">
                                  ¥{item.unit_price.toLocaleString()} × {item.quantity}
                                </div>
                              </td>
                              <td className="text-end pe-0">
                                <div className="fw-medium">
                                  ¥{item.subtotal.toLocaleString()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-top">
                            <td className="ps-0 fw-bold">合計</td>
                            <td className="text-end pe-0 fw-bold">¥{selectedReservation.final_amount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* 備考・管理メモ */}
                  {(selectedReservation.notes || selectedReservation.admin_notes) && (
                    <div className="col-12">
                      <h6 className="fw-medium text-dark mb-3">備考・メモ</h6>
                      {selectedReservation.notes && (
                        <div className="mb-3">
                          <label className="form-label fw-medium">お客様備考</label>
                          <div className="bg-light p-3 rounded">
                            {selectedReservation.notes}
                          </div>
                        </div>
                      )}
                      {selectedReservation.admin_notes && (
                        <div>
                          <label className="form-label fw-medium">管理メモ</label>
                          <div className="bg-warning-subtle p-3 rounded">
                            {selectedReservation.admin_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  閉じる
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => generateReservationPDF(selectedReservation.id)}
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  PDF生成
                </button>
                <button type="button" className="btn btn-primary">
                  <i className="bi bi-pencil me-2"></i>
                  編集
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}