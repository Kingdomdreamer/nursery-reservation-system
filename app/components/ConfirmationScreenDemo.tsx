'use client'

import React, { useState } from 'react'
import ConfirmationScreen from './ConfirmationScreen'
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

export default function ConfirmationScreenDemo() {
  const [currentSettings, setCurrentSettings] = useState<PricingDisplaySettings>({
    show_item_prices: true,
    show_subtotal: true,
    show_total_amount: true,
    show_item_quantity: true,
    pricing_display_mode: 'full'
  })
  const [showLineInfo, setShowLineInfo] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleConfirm = async () => {
    setIsLoading(true)
    setErrorMessage('')
    
    // 確定処理のシミュレーション
    setTimeout(() => {
      setIsLoading(false)
      alert('予約が確定されました！（デモ）')
    }, 2000)
  }

  const handleEdit = () => {
    alert('編集画面に戻ります（デモ）')
  }

  const simulateError = () => {
    setErrorMessage('予約処理中にエラーが発生しました（デモエラー）')
  }

  const clearError = () => {
    setErrorMessage('')
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
                デモ設定
              </h5>
            </div>
            <div className="card-body">
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
                      id="show_item_prices"
                      checked={currentSettings.show_item_prices}
                      onChange={(e) => setCurrentSettings(prev => ({ 
                        ...prev, 
                        show_item_prices: e.target.checked 
                      }))}
                    />
                    <label className="form-check-label small" htmlFor="show_item_prices">
                      商品価格を表示
                    </label>
                  </div>
                  <div className="form-check form-check-sm">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="show_item_quantity"
                      checked={currentSettings.show_item_quantity}
                      onChange={(e) => setCurrentSettings(prev => ({ 
                        ...prev, 
                        show_item_quantity: e.target.checked 
                      }))}
                    />
                    <label className="form-check-label small" htmlFor="show_item_quantity">
                      数量を表示
                    </label>
                  </div>
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

              {/* LINE情報設定 */}
              <div className="mb-4">
                <h6 className="fw-bold">LINE連携</h6>
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

              {/* エラーシミュレーション */}
              <div className="mb-4">
                <h6 className="fw-bold">エラーテスト</h6>
                <div className="d-grid gap-2">
                  <button 
                    onClick={simulateError}
                    className="btn btn-danger btn-sm"
                  >
                    エラー発生
                  </button>
                  <button 
                    onClick={clearError}
                    className="btn btn-success btn-sm"
                  >
                    エラークリア
                  </button>
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：確認画面 */}
        <div className="col-lg-9">
          <ConfirmationScreen
            reservationData={sampleReservationData}
            availableProducts={sampleProducts}
            pricingSettings={currentSettings}
            lineAuthInfo={showLineInfo ? sampleLineAuthInfo : undefined}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </div>
  )
}