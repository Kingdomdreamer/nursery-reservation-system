'use client'

import React from 'react'
import { ReservationData, Product } from '../types'
import { PricingDisplaySettings, LineAuthInfo } from '@/types/forms'
import { 
  PricingDisplayHelper, 
  calculateTotalAmount,
  getPickupDates,
  generateReservationSummary
} from './ConfirmationScreenUtils'

interface Props {
  reservationData?: ReservationData
  availableProducts?: Product[]
  pricingSettings?: PricingDisplaySettings
  lineAuthInfo?: LineAuthInfo
  onManage: () => void
  onNewReservation: () => void
  reservationId?: string
}

export default function CompletionScreen({ 
  reservationData,
  availableProducts = [],
  pricingSettings,
  lineAuthInfo,
  onManage, 
  onNewReservation,
  reservationId
}: Props) {
  const pricingHelper = new PricingDisplayHelper(pricingSettings)
  const totalAmount = reservationData ? calculateTotalAmount(reservationData, availableProducts) : 0
  const pickupDates = reservationData ? getPickupDates(reservationData) : []
  const reservationSummary = reservationData ? generateReservationSummary(reservationData, availableProducts) : null

  return (
    <div className="form-mailer-style">
      <div className="form-mailer-container">
        {/* プログレス表示 */}
        <div className="form-mailer-progress">
          <div className="form-mailer-step">
            <div className="form-mailer-step-number">1</div>
            <span>入力</span>
          </div>
          <div className="form-mailer-step-arrow">→</div>
          <div className="form-mailer-step">
            <div className="form-mailer-step-number">2</div>
            <span>確認</span>
          </div>
          <div className="form-mailer-step-arrow">→</div>
          <div className="form-mailer-step active">
            <div className="form-mailer-step-number">3</div>
            <span>完了</span>
          </div>
        </div>

        <h1 className="form-mailer-title">予約完了</h1>
        
        <div className="form-mailer-success">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            ご予約ありがとうございました
          </div>
          <div style={{ fontSize: '14px' }}>
            予約が正常に完了いたしました。
          </div>
        </div>

        {/* 予約番号 */}
        {reservationId && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th>予約番号</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ 
                    textAlign: 'center', 
                    fontSize: '18px', 
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    color: '#333333',
                    padding: '16px'
                  }}>
                    {reservationId}
                  </td>
                </tr>
                <tr>
                  <td style={{ 
                    textAlign: 'center', 
                    fontSize: '12px', 
                    color: '#666666',
                    padding: '8px'
                  }}>
                    この番号はお問い合わせの際に必要です
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 予約内容サマリー */}
        {reservationData && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th colSpan={2}>ご予約内容</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>お名前</th>
                  <td>{reservationData.name}</td>
                </tr>
                <tr>
                  <th>商品数</th>
                  <td>{reservationData.products?.length || 0}点</td>
                </tr>
                {pricingHelper.shouldShowTotal() && (
                  <tr>
                    <th>合計金額</th>
                    <td style={{ fontWeight: '600', color: '#333333' }}>
                      ¥{totalAmount.toLocaleString()}
                    </td>
                  </tr>
                )}
                {pickupDates.length > 0 && (
                  <tr>
                    <th>引き取り予定日</th>
                    <td>
                      {pickupDates.map((date, index) => (
                        <span key={index} style={{ 
                          display: 'inline-block',
                          margin: '2px 4px 2px 0',
                          padding: '4px 8px',
                          backgroundColor: '#e8f5e8',
                          border: '1px solid #4caf50',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#2e7d32'
                        }}>
                          {date}
                        </span>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LINE連携情報 */}
        {lineAuthInfo && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th colSpan={2}>LINE連携完了</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>ユーザー名</th>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {lineAuthInfo.profile.pictureUrl && (
                        <img 
                          src={lineAuthInfo.profile.pictureUrl} 
                          alt="LINE Profile" 
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                      )}
                      <span>{lineAuthInfo.profile.displayName}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>連携状況</th>
                  <td>✓ 連携完了</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* お問い合わせ先 */}
        <div className="form-mailer-section">
          <table className="form-mailer-table">
            <thead>
              <tr>
                <th>お問い合わせ先</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ marginBottom: '12px', color: '#666666' }}>
                    予約内容の詳細やご質問は、以下までお気軽にお問い合わせください
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f5f5f5', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#333333',
                      marginBottom: '8px'
                    }}>
                      TEL: 0120-XXX-XXX
                    </div>
                    <div style={{ fontSize: '14px', color: '#666666' }}>
                      営業時間: 9:00-18:00　営業日: 月〜金（土日祝除く）
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* アクションボタン */}
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={onManage} 
            className="form-mailer-button-secondary"
            style={{ marginBottom: '10px' }}
          >
            予約を変更・キャンセル
          </button>
          <button 
            onClick={onNewReservation} 
            className="form-mailer-button"
          >
            新しい予約をする
          </button>
        </div>

        {/* 注意事項 */}
        <div className="form-mailer-info" style={{ marginTop: '30px' }}>
          <strong>ご注意事項</strong><br />
          • 予約の変更・キャンセルは引き取り日の前日までにお願いします<br />
          • 当日の変更・キャンセルはお電話にてご連絡ください<br />
          • 商品の準備状況により、お引き取り時間が前後する場合があります
        </div>

        {/* フッター情報 */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '30px', 
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0',
          fontSize: '12px', 
          color: '#666666' 
        }}>
          新鮮な農産物をお届けいたします。ありがとうございました。
        </div>
      </div>
    </div>
  )
}