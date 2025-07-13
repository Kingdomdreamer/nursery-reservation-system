'use client'

import React from 'react'
import { ReservationData, Product } from '../types'

interface Props {
  reservationData: ReservationData
  availableProducts: Product[]
  onConfirm: () => void
  onEdit: () => void
}

export default function ConfirmationScreen({ 
  reservationData, 
  availableProducts, 
  onConfirm, 
  onEdit 
}: Props) {
  const genderText = {
    male: '男性',
    female: '女性',
    other: 'その他'
  }

  const calculateTotal = () => {
    return reservationData.products?.reduce((total, item) => {
      const product = availableProducts.find(p => p.id === item.productId)
      return total + (product ? product.price * item.quantity : 0)
    }, 0) || 0
  }

  const fullAddress = `${reservationData.prefecture}${reservationData.city}${reservationData.town || ''}${reservationData.addressDetail}`

  return (
    <div className="form-container">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">入力内容確認</h2>
      
      <div className="space-y-6 mb-8">
        <div className="confirmation-item">
          <label className="confirmation-label">お名前</label>
          <p className="confirmation-value">{reservationData.name}</p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">フリガナ</label>
          <p className="confirmation-value">{reservationData.furigana}</p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">電話番号</label>
          <p className="confirmation-value">{reservationData.phone}</p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">ご住所</label>
          <p className="confirmation-value">
            〒{reservationData.zipcode}<br />
            {fullAddress}
          </p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">性別</label>
          <p className="confirmation-value">{genderText[reservationData.gender]}</p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">生年月日</label>
          <p className="confirmation-value">{reservationData.birthDate}</p>
        </div>
        
        <div className="confirmation-item">
          <label className="confirmation-label">ご予約商品</label>
          <div className="mt-3 space-y-4">
            {reservationData.products?.map((item, index) => {
              const product = availableProducts.find(p => p.id === item.productId)
              return (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xl font-semibold text-gray-900">
                        {product?.name}
                      </p>
                      <p className="text-lg text-gray-600 mt-1">
                        数量: {item.quantity}個
                      </p>
                      <p className="text-lg text-gray-600">
                        引き取り日: {item.pickupDate}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      ¥{((product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {reservationData.comment && (
          <div className="confirmation-item">
            <label className="confirmation-label">店舗へのコメント</label>
            <p className="confirmation-value">{reservationData.comment}</p>
          </div>
        )}
        
        <div className="total-amount">
          <div className="text-xl text-gray-700 mb-2">合計金額</div>
          <div className="text-3xl font-bold text-blue-600">
            ¥{calculateTotal().toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <button onClick={onConfirm} className="btn-primary">
          ✅ 予約を確定する
        </button>
        <button onClick={onEdit} className="btn-secondary">
          ✏️ 内容を修正する
        </button>
      </div>
    </div>
  )
}