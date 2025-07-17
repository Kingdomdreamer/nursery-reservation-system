'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Reservation, Customer, Product } from '../../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

interface ReservationEditModalProps {
  reservation: Reservation
  isOpen: boolean
  onClose: () => void
  onSave: (updatedReservation: Reservation) => void
}

export default function ReservationEditModal({ 
  reservation, 
  isOpen, 
  onClose, 
  onSave 
}: ReservationEditModalProps) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    customer_id: reservation.customer_id,
    reservation_date: reservation.reservation_date,
    pickup_time_start: reservation.pickup_time_start || '',
    pickup_time_end: reservation.pickup_time_end || '',
    status: reservation.status,
    notes: reservation.notes || '',
    admin_notes: reservation.admin_notes || '',
    final_amount: reservation.final_amount
  })
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [reservationItems, setReservationItems] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      fetchProducts()
      fetchReservationItems()
    }
  }, [isOpen, reservation.id])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('顧客データの取得に失敗:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品データの取得に失敗:', error)
    }
  }

  const fetchReservationItems = async () => {
    try {
      const { data, error } = await supabase
        .from('reservation_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('reservation_id', reservation.id)

      if (error) throw error
      setReservationItems(data || [])
    } catch (error) {
      console.error('予約アイテムの取得に失敗:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    setReservationItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity, subtotal: item.unit_price * quantity }
          : item
      )
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // 予約の基本情報を更新
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          customer_id: formData.customer_id,
          reservation_date: formData.reservation_date,
          pickup_time_start: formData.pickup_time_start || null,
          pickup_time_end: formData.pickup_time_end || null,
          status: formData.status,
          notes: formData.notes || null,
          admin_notes: formData.admin_notes || null,
          final_amount: formData.final_amount,
          total_amount: reservationItems.reduce((sum, item) => sum + item.subtotal, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id)

      if (reservationError) throw reservationError

      // 予約アイテムを更新
      for (const item of reservationItems) {
        const { error: itemError } = await supabase
          .from('reservation_items')
          .update({
            quantity: item.quantity,
            subtotal: item.subtotal
          })
          .eq('id', item.id)

        if (itemError) throw itemError
      }

      // 更新された予約データを取得
      const { data: updatedReservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*),
          reservation_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', reservation.id)
        .single()

      if (fetchError) throw fetchError

      showSuccess('予約が更新されました')
      onSave(updatedReservation)
      onClose()
    } catch (error) {
      console.error('予約の更新に失敗:', error)
      showError('予約の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">予約編集 - {reservation.reservation_number}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            <div className="row g-3">
              {/* 顧客選択 */}
              <div className="col-md-6">
                <label className="form-label fw-medium">顧客</label>
                <select
                  className="form-select"
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange('customer_id', e.target.value)}
                >
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* ステータス */}
              <div className="col-md-6">
                <label className="form-label fw-medium">ステータス</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="pending">保留中</option>
                  <option value="confirmed">確定</option>
                  <option value="ready">準備完了</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>

              {/* 受取日 */}
              <div className="col-md-6">
                <label className="form-label fw-medium">受取日</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.reservation_date}
                  onChange={(e) => handleInputChange('reservation_date', e.target.value)}
                />
              </div>

              {/* 受取時間帯 */}
              <div className="col-md-3">
                <label className="form-label fw-medium">受取開始時間</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.pickup_time_start}
                  onChange={(e) => handleInputChange('pickup_time_start', e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-medium">受取終了時間</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.pickup_time_end}
                  onChange={(e) => handleInputChange('pickup_time_end', e.target.value)}
                />
              </div>

              {/* 予約アイテム */}
              <div className="col-12">
                <label className="form-label fw-medium">注文内容</label>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>商品名</th>
                        <th>単価</th>
                        <th>数量</th>
                        <th>小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservationItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.product?.name}</td>
                          <td>¥{item.unit_price.toLocaleString()}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              min="1"
                              onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td>¥{item.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3}>合計</th>
                        <th>¥{reservationItems.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 顧客備考 */}
              <div className="col-12">
                <label className="form-label fw-medium">顧客備考</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="顧客からの備考・要望"
                />
              </div>

              {/* 管理メモ */}
              <div className="col-12">
                <label className="form-label fw-medium">管理メモ</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.admin_notes}
                  onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                  placeholder="管理者向けメモ"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}