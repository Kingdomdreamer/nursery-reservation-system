'use client'

import React, { useState, useEffect } from 'react'
import ReservationFormTemplate from './ReservationFormTemplate'
import { supabase } from '@/lib/supabase'
import { Icons, Icon } from '../../components/icons/Icons'

interface StandardReservationFormProps {
  onSubmit?: (data: any) => void
  onCancel?: () => void
  liffProfile?: {
    userId?: string
    displayName?: string
    pictureUrl?: string
    statusMessage?: string
  } | null
  isLiffReady?: boolean
  businessSettings?: {
    businessName?: string
    businessHours?: { start: string; end: string }
    pickupTimeSlots?: string[]
    reservationSettings?: {
      maxDaysAhead?: number
      minHoursAhead?: number
    }
  }
}

export default function StandardReservationForm({
  onSubmit,
  onCancel,
  liffProfile,
  isLiffReady,
  businessSettings
}: StandardReservationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFormSubmit = async (formData: any) => {
    setLoading(true)
    setError(null)

    try {
      // 1. 顧客情報の作成または更新
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
          full_name: formData.customer.full_name,
          phone: formData.customer.phone,
          email: formData.customer.email || null,
          postal_code: formData.customer.postal_code || null,
          prefecture: formData.customer.prefecture || null,
          city: formData.customer.city || null,
          address_line1: formData.customer.address || null,
          line_user_id: formData.customer.line_user_id || null,
          preferred_contact_method: 'email',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (customerError) throw customerError

      // 2. 予約番号の生成
      const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      // 3. 予約の作成
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          reservation_number: reservationNumber,
          customer_id: customer.id,
          reservation_date: formData.reservation_date,
          pickup_time_start: formData.pickup_time_slot.split('-')[0],
          pickup_time_end: formData.pickup_time_slot.split('-')[1],
          status: 'pending',
          payment_status: 'unpaid',
          total_amount: formData.total_amount,
          final_amount: formData.total_amount,
          notes: formData.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (reservationError) throw reservationError

      // 4. 予約商品の作成
      const reservationItems = formData.items.map((item: any) => ({
        reservation_id: reservation.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        pickup_date: formData.reservation_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(reservationItems)

      if (itemsError) throw itemsError

      // 5. LINE認証情報の連携（利用可能な場合）
      if (liffProfile?.userId && isLiffReady) {
        try {
          const { error: lineAuthError } = await supabase
            .from('customers')
            .update({
              line_user_id: liffProfile.userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', customer.id)

          if (lineAuthError) {
            console.error('LINE認証情報の更新に失敗しました:', lineAuthError)
          }
        } catch (lineError) {
          console.error('LINE認証情報の処理中にエラーが発生しました:', lineError)
        }
      }

      // 6. 成功処理
      setSuccess(true)
      
      if (onSubmit) {
        onSubmit({
          reservation,
          customer,
          items: reservationItems,
          reservationNumber
        })
      }

    } catch (error) {
      console.error('予約の作成に失敗しました:', error)
      setError('予約の作成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <Icon icon={Icons.success} size="lg" className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">予約完了</h2>
          <p className="text-gray-600 mb-6">
            ご予約が正常に完了しました。<br />
            確認メールをお送りしますので、しばらくお待ちください。
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>次のステップ:</strong><br />
              1. 確認メールをご確認ください<br />
              2. 指定の日時にお越しください<br />
              3. 変更が必要な場合は店舗にご連絡ください
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {businessSettings?.businessName || '種苗店'} 予約システム
        </h1>
        <p className="text-gray-600">
          商品の予約を行います。必要事項をご記入ください。
        </p>
      </div>

      {/* 営業時間の表示 */}
      {businessSettings?.businessHours && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon icon={Icons.clock} size="sm" className="text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              営業時間: {businessSettings.businessHours.start} - {businessSettings.businessHours.end}
            </span>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <Icon icon={Icons.warning} size="sm" className="text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* フォーム本体 */}
      <ReservationFormTemplate
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        liffProfile={liffProfile}
        isLiffReady={isLiffReady}
      />

      {/* 注意事項 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          ご予約に関する注意事項
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• キャンセルは前日までにご連絡ください</li>
          <li>• 受取時間に遅れる場合は事前にご連絡ください</li>
        </ul>
      </div>
    </div>
  )
}