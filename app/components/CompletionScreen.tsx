'use client'

import React from 'react'

interface Props {
  onManage: () => void
  onNewReservation: () => void
}

export default function CompletionScreen({ onManage, onNewReservation }: Props) {
  return (
    <div className="form-container text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">予約完了</h2>
        <div className="text-xl text-gray-600 leading-relaxed">
          <p className="mb-2">ご予約ありがとうございました。</p>
          <p className="mb-4">予約内容の詳細は、お電話でお問い合わせください。</p>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="text-lg font-semibold text-blue-800 mb-2">お問い合わせ先</p>
            <p className="text-xl font-bold text-blue-900">TEL: 0120-XXX-XXX</p>
            <p className="text-base text-blue-700 mt-2">営業時間: 9:00-18:00（土日祝除く）</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <button onClick={onManage} className="btn-primary">
          📝 予約を変更・キャンセル
        </button>
        <button onClick={onNewReservation} className="btn-secondary">
          🆕 新しい予約をする
        </button>
      </div>
    </div>
  )
}