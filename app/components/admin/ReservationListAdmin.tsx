'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Reservation, Customer, ReservationItem } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

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
    // 実際の実装では、LINE API やメール送信処理を行う
    console.log('確認通知を送信:', reservationId)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '保留中', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '確定', className: 'bg-green-100 text-green-800' },
      ready: { label: '準備完了', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '完了', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'キャンセル', className: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      unpaid: { label: '未払い', className: 'bg-red-100 text-red-800' },
      paid: { label: '支払済', className: 'bg-green-100 text-green-800' },
      partial: { label: '一部支払', className: 'bg-yellow-100 text-yellow-800' },
      refunded: { label: '返金済', className: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">予約一覧</h2>
        <div className="flex gap-3">
          <button className="btn-modern btn-success-modern">
            📝 新規予約追加
          </button>
          <button className="btn-modern btn-outline-modern">
            📊 予約レポート
          </button>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">保留中</option>
              <option value="confirmed">確定</option>
              <option value="ready">準備完了</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              受取日
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="予約番号、顧客名、電話番号で検索"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {filteredReservations.length} 件の予約
            </div>
          </div>
        </div>
      </div>

      {/* 予約リスト */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* デスクトップ用テーブル表示 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  受取日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支払い
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.reservation_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        作成: {new Date(reservation.created_at).toLocaleDateString()}
                      </div>
                      {reservation.notes && (
                        <div className="text-xs text-gray-400 mt-1">
                          📝 {reservation.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reservation.customer?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        📞 {reservation.customer?.phone}
                      </div>
                      {reservation.customer?.email && (
                        <div className="text-sm text-gray-500">
                          📧 {reservation.customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(reservation.reservation_date).toLocaleDateString()}
                    </div>
                    {reservation.pickup_time_start && reservation.pickup_time_end && (
                      <div className="text-sm text-gray-500">
                        {reservation.pickup_time_start} - {reservation.pickup_time_end}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ¥{reservation.final_amount.toLocaleString()}
                    </div>
                    {reservation.discount_amount > 0 && (
                      <div className="text-xs text-green-600">
                        割引: -¥{reservation.discount_amount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">保留中</option>
                      <option value="confirmed">確定</option>
                      <option value="ready">準備完了</option>
                      <option value="completed">完了</option>
                      <option value="cancelled">キャンセル</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentStatusBadge(reservation.payment_status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailModal(reservation)}
                        className="btn-modern btn-outline-modern btn-sm"
                      >
                        👁️ 詳細
                      </button>
                      <button className="btn-modern btn-primary-modern btn-sm">
                        ✏️ 編集
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイル・タブレット用カード表示 */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.reservation_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.customer?.full_name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(reservation.status)}
                    {getPaymentStatusBadge(reservation.payment_status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">受取日:</span>
                    <div className="font-medium">
                      {new Date(reservation.reservation_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">金額:</span>
                    <div className="font-medium">
                      ¥{reservation.final_amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">電話:</span>
                    <div>{reservation.customer?.phone}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">作成:</span>
                    <div>{new Date(reservation.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex-1 mr-3">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="pending">保留中</option>
                      <option value="confirmed">確定</option>
                      <option value="ready">準備完了</option>
                      <option value="completed">完了</option>
                      <option value="cancelled">キャンセル</option>
                    </select>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openDetailModal(reservation)}
                      className="btn-modern btn-outline-modern btn-sm text-xs px-2 py-1"
                    >
                      詳細
                    </button>
                    <button className="btn-modern btn-primary-modern btn-sm text-xs px-2 py-1">
                      編集
                    </button>
                  </div>
                </div>

                {reservation.notes && (
                  <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                    📝 {reservation.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">予約が見つかりません</h3>
          <p className="text-gray-500">検索条件を変更するか、新しい予約を追加してください。</p>
        </div>
      )}

      {/* 詳細モーダル */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">予約詳細</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-modern btn-ghost-modern btn-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">予約番号</label>
                    <div className="text-sm text-gray-900">{selectedReservation.reservation_number}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <div>{getStatusBadge(selectedReservation.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">受取日</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedReservation.reservation_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">支払いステータス</label>
                    <div>{getPaymentStatusBadge(selectedReservation.payment_status)}</div>
                  </div>
                </div>

                {/* 顧客情報 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">顧客情報</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
                      <div className="text-sm text-gray-900">{selectedReservation.customer?.full_name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                      <div className="text-sm text-gray-900">{selectedReservation.customer?.phone}</div>
                    </div>
                    {selectedReservation.customer?.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                        <div className="text-sm text-gray-900">{selectedReservation.customer.email}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 注文商品 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">注文商品</h4>
                  <div className="space-y-2">
                    {selectedReservation.reservation_items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-500">
                            ¥{item.unit_price.toLocaleString()} × {item.quantity}
                          </div>
                        </div>
                        <div className="font-medium">
                          ¥{item.subtotal.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between font-bold">
                      <span>合計</span>
                      <span>¥{selectedReservation.final_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 備考・管理メモ */}
                {(selectedReservation.notes || selectedReservation.admin_notes) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">備考・メモ</h4>
                    {selectedReservation.notes && (
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">お客様備考</label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {selectedReservation.notes}
                        </div>
                      </div>
                    )}
                    {selectedReservation.admin_notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">管理メモ</label>
                        <div className="text-sm text-gray-900 bg-yellow-50 p-2 rounded">
                          {selectedReservation.admin_notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-modern btn-secondary-modern"
                >
                  閉じる
                </button>
                <button className="btn-modern btn-primary-modern">
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