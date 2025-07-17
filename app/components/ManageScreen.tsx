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
    <div className="form-mailer-container">
      <div className="form-mailer-section">
        <h2 className="form-mailer-title">予約の変更・キャンセル</h2>
        
        <div className="alert alert-warning mb-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <h5 className="alert-heading mb-2">予約の変更・キャンセルについて</h5>
              <p className="mb-0">
                予約の変更・キャンセルをご希望の場合は、<br />
                お電話にてお問い合わせください。
              </p>
            </div>
          </div>
        </div>
        
        {reservationData && (
          <div className="form-mailer-section">
            <h3 className="h5 fw-semibold text-dark mb-3">現在の予約情報</h3>
            <div className="card">
              <div className="card-body">
                <table className="form-mailer-table">
                  <tbody>
                    <tr>
                      <th>お名前</th>
                      <td>{reservationData.name}</td>
                    </tr>
                    <tr>
                      <th>電話番号</th>
                      <td>{reservationData.phone}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="alert alert-info mb-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-telephone-fill me-2"></i>
            <div>
              <h5 className="alert-heading mb-2">お問い合わせ先</h5>
              <p className="h4 fw-bold mb-2">TEL: 0120-XXX-XXX</p>
              <p className="mb-0">営業時間: 9:00-18:00（土日祝除く）</p>
            </div>
          </div>
        </div>
        
        <div className="d-grid gap-3">
          <button 
            onClick={handleCallShop} 
            className="form-mailer-button"
            type="button"
          >
            <i className="bi bi-telephone me-2"></i>
            電話でお問い合わせ
          </button>
          <button 
            onClick={onBack} 
            className="form-mailer-button form-mailer-button-secondary"
            type="button"
          >
            <i className="bi bi-arrow-left me-2"></i>
            前の画面に戻る
          </button>
        </div>
      </div>
    </div>
  )
}