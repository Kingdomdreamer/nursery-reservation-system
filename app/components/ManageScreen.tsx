'use client'

import React from 'react'

interface ReservationData {
  name: string
  phone: string
}

interface Props {
  reservationData: ReservationData | null
  onBack: () => void
}

export default function ManageScreen({ reservationData, onBack }: Props) {
  const handleCallShop = () => {
    // 実際のアプリでは電話アプリを起動
    if (typeof window !== 'undefined') {
      window.location.href = 'tel:0120-XXX-XXX'
    }
  }

  return (
    <div className="form-container text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">予約の変更・キャンセル</h2>
      
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
        <div className="text-yellow-800">
          <p className="text-xl font-semibold mb-3">
            予約の変更・キャンセルについて
          </p>
          <div className="text-lg leading-relaxed space-y-2">
            <p>予約の変更・キャンセルをご希望の場合は、</p>
            <p>お電話にてお問い合わせください。</p>
          </div>
        </div>
      </div>
      
      {reservationData && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">現在の予約情報</h3>
          <div className="bg-gray-50 p-6 rounded-lg text-left border border-gray-200">
            <div className="space-y-3">
              <div>
                <span className="text-lg font-medium text-gray-700">お名前: </span>
                <span className="text-lg text-gray-900">{reservationData.name}</span>
              </div>
              <div>
                <span className="text-lg font-medium text-gray-700">電話番号: </span>
                <span className="text-lg text-gray-900">{reservationData.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8">
        <p className="text-lg font-semibold text-blue-800 mb-2">お問い合わせ先</p>
        <p className="text-2xl font-bold text-blue-900 mb-2">TEL: 0120-XXX-XXX</p>
        <p className="text-base text-blue-700">営業時間: 9:00-18:00（土日祝除く）</p>
      </div>
      
      <div className="space-y-4">
        <button onClick={handleCallShop} className="btn-primary">
          電話でお問い合わせ
        </button>
        <button onClick={onBack} className="btn-secondary">
          前の画面に戻る
        </button>
      </div>
    </div>
  )
}