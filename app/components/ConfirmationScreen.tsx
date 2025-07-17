'use client'

import React, { useState, useEffect } from 'react'
import { ReservationData, Product } from '../types'
import { PricingDisplaySettings, LineAuthInfo } from '@/types/forms'
import { 
  PricingDisplayHelper, 
  validateReservationData,
  calculateTotalAmount,
  getFormattedAddress,
  formatValidationErrors,
  getPickupDates
} from './ConfirmationScreenUtils'

interface Props {
  reservationData: ReservationData
  availableProducts: Product[]
  pricingSettings?: PricingDisplaySettings
  lineAuthInfo?: LineAuthInfo
  onConfirm: () => void
  onEdit: () => void
  isLoading?: boolean
  errorMessage?: string
}

export default function ConfirmationScreen({ 
  reservationData, 
  availableProducts, 
  pricingSettings,
  lineAuthInfo,
  onConfirm, 
  onEdit,
  isLoading = false,
  errorMessage
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const pricingHelper = new PricingDisplayHelper(pricingSettings)

  // バリデーション実行
  useEffect(() => {
    const validation = validateReservationData(reservationData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(error => error.message))
    } else {
      setValidationErrors([])
    }
  }, [reservationData])

  const genderText = {
    male: '男性',
    female: '女性',
    other: 'その他'
  }

  const totalAmount = calculateTotalAmount(reservationData, availableProducts)
  const fullAddress = getFormattedAddress(reservationData)
  const pickupDates = getPickupDates(reservationData)

  const handleConfirm = async () => {
    // 最終バリデーション
    const validation = validateReservationData(reservationData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors.map(error => error.message))
      return
    }

    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

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
          <div className="form-mailer-step active">
            <div className="form-mailer-step-number">2</div>
            <span>確認</span>
          </div>
          <div className="form-mailer-step-arrow">→</div>
          <div className="form-mailer-step">
            <div className="form-mailer-step-number">3</div>
            <span>完了</span>
          </div>
        </div>

        <h1 className="form-mailer-title">入力内容確認</h1>
        
        <div className="form-mailer-info">
          以下の内容でご予約を確定いたします。内容をご確認の上、問題がなければ「予約を確定する」ボタンをクリックしてください。
        </div>

        {/* エラーメッセージ */}
        {(errorMessage || validationErrors.length > 0) && (
          <div style={{ 
            backgroundColor: '#fff3f3', 
            border: '1px solid #d32f2f', 
            borderRadius: '4px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            {errorMessage && <div style={{ color: '#d32f2f', fontWeight: '600' }}>{errorMessage}</div>}
            {validationErrors.length > 0 && (
              <div>
                <div style={{ color: '#d32f2f', fontWeight: '600', marginBottom: '8px' }}>
                  入力内容をご確認ください：
                </div>
                <ul style={{ color: '#d32f2f', margin: '0', paddingLeft: '20px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 顧客情報 */}
        <div className="form-mailer-section">
          <table className="form-mailer-table">
            <thead>
              <tr>
                <th colSpan={2}>お客様情報</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>お名前</th>
                <td>{reservationData.name}</td>
              </tr>
              <tr>
                <th>フリガナ</th>
                <td>{reservationData.furigana}</td>
              </tr>
              <tr>
                <th>電話番号</th>
                <td>{reservationData.phone}</td>
              </tr>
              <tr>
                <th>性別</th>
                <td>{genderText[reservationData.gender]}</td>
              </tr>
              <tr>
                <th>生年月日</th>
                <td>{reservationData.birthDate}</td>
              </tr>
              <tr>
                <th>郵便番号</th>
                <td>〒{reservationData.zipcode}</td>
              </tr>
              <tr>
                <th>ご住所</th>
                <td>{fullAddress}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LINE認証情報 */}
        {lineAuthInfo && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th colSpan={2}>LINE連携情報</th>
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
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                      )}
                      <span>{lineAuthInfo.profile.displayName}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>連携状況</th>
                  <td>✓ LINE認証済み</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 予約商品 */}
        <div className="form-mailer-section">
          <table className="form-mailer-table">
            <thead>
              <tr>
                <th colSpan={pricingHelper.shouldShowItemPrices() ? 4 : 3}>ご予約商品</th>
              </tr>
              <tr>
                <th>商品名</th>
                {pricingHelper.shouldShowQuantity() && <th>数量</th>}
                <th>引き取り日</th>
                {pricingHelper.shouldShowItemPrices() && <th>小計</th>}
              </tr>
            </thead>
            <tbody>
              {reservationData.products?.map((item, index) => {
                const product = availableProducts.find(p => p.id === item.productId)
                return (
                  <tr key={index}>
                    <td>{product?.name}</td>
                    {pricingHelper.shouldShowQuantity() && <td>{item.quantity}個</td>}
                    <td>{item.pickupDate}</td>
                    {pricingHelper.shouldShowItemPrices() && (
                      <td style={{ fontWeight: '600' }}>
                        ¥{((product?.price || 0) * item.quantity).toLocaleString()}
                        {pricingHelper.shouldShowQuantity() && (
                          <div style={{ fontSize: '12px', color: '#666666' }}>
                            ¥{(product?.price || 0).toLocaleString()} × {item.quantity}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* コメント */}
        {reservationData.comment && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th>店舗へのコメント</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{reservationData.comment}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 引き取り日の概要 */}
        {pickupDates.length > 0 && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th>引き取り予定日</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {pickupDates.map((date, index) => (
                      <span key={index} style={{ 
                        display: 'inline-block',
                        margin: '2px 4px 2px 0',
                        padding: '4px 8px',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        {date}
                      </span>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 合計金額 */}
        {pricingHelper.shouldShowTotal() && (
          <div className="form-mailer-section">
            <table className="form-mailer-table">
              <thead>
                <tr>
                  <th colSpan={2} style={{ 
                    backgroundColor: '#333333', 
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '700'
                  }}>
                    合計金額
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    fontWeight: '700',
                    color: '#333333',
                    padding: '20px'
                  }}>
                    ¥{totalAmount.toLocaleString()}
                  </td>
                </tr>
                {pricingSettings && (
                  <tr>
                    <td style={{ 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      color: '#666666',
                      fontStyle: 'italic'
                    }}>
                      {pricingHelper.getDisplayModeDescription()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* アクションボタン */}
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={handleConfirm} 
            disabled={isLoading || isConfirming || validationErrors.length > 0}
            className="form-mailer-button"
            style={{ 
              backgroundColor: isLoading || isConfirming || validationErrors.length > 0 
                ? '#cccccc' : '#333333',
              cursor: isLoading || isConfirming || validationErrors.length > 0 
                ? 'not-allowed' : 'pointer'
            }}
          >
            {isConfirming ? '予約確定中...' : '予約を確定する'}
          </button>
          
          <button 
            onClick={onEdit} 
            disabled={isLoading || isConfirming}
            className="form-mailer-button-secondary"
            style={{ marginTop: '10px' }}
          >
            内容を修正する
          </button>
          
          {/* バリデーションエラーがある場合の注意表示 */}
          {validationErrors.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px', 
              padding: '12px', 
              marginTop: '16px',
              fontSize: '14px',
              color: '#856404'
            }}>
              上記のエラーを修正してから予約を確定してください。
            </div>
          )}
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
          入力された情報は安全に暗号化されて送信されます
        </div>
      </div>
    </div>
  )
}