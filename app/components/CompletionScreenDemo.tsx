'use client'

import React, { useState } from 'react'
import CompletionScreen from './CompletionScreen'
import { PricingDisplaySettings, LineAuthInfo } from '@/types/forms'

// サンプルデータ
const sampleReservationData = {
  name: '山田太郎',
  furigana: 'ヤマダタロウ',
  phone: '090-1234-5678',
  email: 'yamada@example.com',
  zipcode: '123-4567',
  prefecture: '東京都',
  city: '渋谷区',
  town: '恵比寿',
  addressDetail: '1-2-3 恵比寿マンション101',
  gender: 'male' as const,
  birthDate: '1990-01-01',
  comment: 'アレルギー対応をお願いします。',
  products: [
    {
      productId: '1',
      quantity: 2,
      pickupDate: '2024-01-15'
    },
    {
      productId: '2',
      quantity: 1,
      pickupDate: '2024-01-20'
    }
  ]
}

const sampleProducts = [
  {
    id: '1',
    name: '新鮮トマト（1kg）',
    price: 800,
    category_id: 'vegetables',
    description: '朝採れの新鮮なトマトです',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    name: '有機きゅうり（5本）',
    price: 500,
    category_id: 'vegetables',
    description: '農薬を使わない有機栽培のきゅうりです',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

const sampleLineAuthInfo: LineAuthInfo = {
  line_user_id: 'U1234567890abcdef',
  customer_id: 'customer_123',
  profile: {
    userId: 'U1234567890abcdef',
    displayName: '山田太郎',
    pictureUrl: 'https://profile.line-scdn.net/sample_picture.jpg',
    statusMessage: 'よろしくお願いします！'
  },
  access_token: 'sample_access_token',
  last_linked_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export default function CompletionScreenDemo() {
  const [currentSettings, setCurrentSettings] = useState<PricingDisplaySettings>({
    show_item_prices: true,
    show_subtotal: true,
    show_total_amount: true,
    show_item_quantity: true,
    pricing_display_mode: 'full'
  })
  const [showLineInfo, setShowLineInfo] = useState(true)
  const [showReservationData, setShowReservationData] = useState(true)
  const [reservationId, setReservationId] = useState('RES-20240117-001')

  const handleManage = () => {
    alert('予約管理画面に移動します（デモ）')
  }

  const handleNewReservation = () => {
    alert('新しい予約フォームに移動します（デモ）')
  }

  const generateRandomReservationId = () => {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setReservationId(`RES-${dateStr}-${randomNum}`)
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* 左側：設定パネル */}
        <div className="col-lg-3">
          <div className="card sticky-top" style={{ top: '20px' }}>
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear-fill me-2"></i>
                完了画面デモ設定
              </h5>
            </div>
            <div className="card-body">
              {/* 予約番号設定 */}
              <div className="mb-4">
                <h6 className="fw-bold">予約番号</h6>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    className="form-control"
                    placeholder="予約番号を入力"
                  />
                  <button 
                    onClick={generateRandomReservationId}
                    className="btn btn-outline-secondary"
                    type="button"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
                <div className="form-check form-check-sm mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="show_reservation_id"
                    checked={!!reservationId}
                    onChange={(e) => setReservationId(e.target.checked ? 'RES-20240117-001' : '')}
                  />
                  <label className="form-check-label small" htmlFor="show_reservation_id">
                    予約番号を表示
                  </label>
                </div>
              </div>

              {/* 価格表示設定 */}
              <div className="mb-4">
                <h6 className="fw-bold">価格表示モード</h6>
                <select
                  value={currentSettings.pricing_display_mode}
                  onChange={(e) => setCurrentSettings(prev => ({ 
                    ...prev, 
                    pricing_display_mode: e.target.value as any
                  }))}
                  className="form-select form-select-sm"
                >
                  <option value="full">詳細表示</option>
                  <option value="summary">合計のみ</option>
                  <option value="hidden">非表示</option>
                  <option value="custom">カスタム</option>
                </select>
              </div>

              {currentSettings.pricing_display_mode === 'custom' && (
                <div className="mb-4">
                  <h6 className="fw-bold">カスタム設定</h6>
                  <div className="form-check form-check-sm">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_total_amount"
                      checked={currentSettings.show_total_amount}
                      onChange={(e) => setCurrentSettings(prev => ({ 
                        ...prev, 
                        show_total_amount: e.target.checked 
                      }))}
                    />
                    <label className="form-check-label small" htmlFor="show_total_amount">
                      合計金額を表示
                    </label>
                  </div>
                </div>
              )}

              {/* データ表示設定 */}
              <div className="mb-4">
                <h6 className="fw-bold">表示データ</h6>
                <div className="form-check form-check-sm">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="show_reservation_data"
                    checked={showReservationData}
                    onChange={(e) => setShowReservationData(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="show_reservation_data">
                    予約内容を表示
                  </label>
                </div>
                <div className="form-check form-check-sm">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="show_line_info"
                    checked={showLineInfo}
                    onChange={(e) => setShowLineInfo(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="show_line_info">
                    LINE情報を表示
                  </label>
                </div>
              </div>

              {/* 統計情報 */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6 className="fw-bold small">統計</h6>
                <div className="small text-muted">
                  <div>商品数: {sampleReservationData.products.length}</div>
                  <div>
                    合計金額: ¥{sampleReservationData.products.reduce((total, item) => {
                      const product = sampleProducts.find(p => p.id === item.productId)
                      return total + (product ? product.price * item.quantity : 0)
                    }, 0).toLocaleString()}
                  </div>
                  <div>引き取り日数: {new Set(sampleReservationData.products.map(p => p.pickupDate)).size}</div>
                </div>
              </div>

              {/* 画面の特徴 */}
              <div className="mt-4 p-3 bg-primary-subtle rounded">
                <h6 className="fw-bold small text-primary">完了画面の特徴</h6>
                <ul className="small text-primary-emphasis mb-0 ps-3">
                  <li>成功メッセージの明確な表示</li>
                  <li>予約番号による識別</li>
                  <li>予約内容の簡潔なサマリー</li>
                  <li>お問い合わせ先の明示</li>
                  <li>次のアクションの提示</li>
                  <li>注意事項の表示</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：完了画面 */}
        <div className="col-lg-9">
          <CompletionScreen
            reservationData={showReservationData ? sampleReservationData : undefined}
            availableProducts={sampleProducts}
            pricingSettings={currentSettings}
            lineAuthInfo={showLineInfo ? sampleLineAuthInfo : undefined}
            onManage={handleManage}
            onNewReservation={handleNewReservation}
            reservationId={reservationId || undefined}
          />
        </div>
      </div>
    </div>
  )
}