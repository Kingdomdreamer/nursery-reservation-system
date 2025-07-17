'use client'

import React from 'react'
import { ProductItem, Product } from '../types'
import { PricingDisplaySettings } from '@/types/forms'
import { PricingDisplayHelper } from './ConfirmationScreenUtils'

interface Props {
  productItems: ProductItem[]
  setProductItems: (items: ProductItem[]) => void
  availableProducts: Product[]
  pricingSettings?: PricingDisplaySettings
  errors?: any
}

export default function ProductSelectionForm({ 
  productItems, 
  setProductItems, 
  availableProducts,
  pricingSettings,
  errors 
}: Props) {
  const pricingHelper = new PricingDisplayHelper(pricingSettings)
  const addProductItem = () => {
    setProductItems([...productItems, { productId: '', quantity: 1, pickupDate: '' }])
  }

  const removeProductItem = (index: number) => {
    if (productItems.length > 1) {
      const newItems = productItems.filter((_, i) => i !== index)
      setProductItems(newItems)
    }
  }

  const updateProductItem = (index: number, field: keyof ProductItem, value: any) => {
    const newItems = [...productItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setProductItems(newItems)
  }

  const calculateTotal = () => {
    return productItems.reduce((total, item) => {
      const product = availableProducts.find(p => p.id === item.productId)
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  const calculateItemSubtotal = (item: ProductItem) => {
    const product = availableProducts.find(p => p.id === item.productId)
    return product ? product.price * item.quantity : 0
  }

  return (
    <div className="form-mailer-section">
      <div className="form-mailer-info">
        ご注文いただく商品をお選びください。複数の商品をご注文の場合は「商品を追加」ボタンで追加できます。
      </div>
      
      {productItems.map((item, index) => (
        <div key={index} style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '4px', 
          padding: '20px', 
          marginBottom: '20px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            borderBottom: '1px solid #e0e0e0',
            paddingBottom: '12px'
          }}>
            <h4 style={{ 
              margin: '0', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#333333' 
            }}>
              商品 {index + 1}
            </h4>
            {productItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeProductItem(index)}
                className="form-mailer-button-secondary"
                style={{ 
                  width: 'auto', 
                  padding: '8px 12px', 
                  fontSize: '12px',
                  margin: '0'
                }}
              >
                削除
              </button>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label className="form-mailer-label">
              商品<span className="form-mailer-required">*</span>
            </label>
            <select
              value={item.productId}
              onChange={(e) => updateProductItem(index, 'productId', e.target.value)}
              className="form-mailer-select"
            >
              <option value="">商品を選択してください</option>
              {availableProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {pricingHelper.shouldShowItemPrices() && ` - ¥${product.price.toLocaleString()}`}
                </option>
              ))}
            </select>
            {errors?.products?.[index]?.productId && (
              <span className="form-mailer-error">{errors.products[index].productId.message}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="form-mailer-label">
                数量<span className="form-mailer-required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={item.quantity}
                onChange={(e) => updateProductItem(index, 'quantity', parseInt(e.target.value) || 1)}
                className="form-mailer-input"
                placeholder="1"
              />
              {errors?.products?.[index]?.quantity && (
                <span className="form-mailer-error">{errors.products[index].quantity.message}</span>
              )}
            </div>

            <div>
              <label className="form-mailer-label">
                引き取り日<span className="form-mailer-required">*</span>
              </label>
              <input
                type="date"
                value={item.pickupDate}
                onChange={(e) => updateProductItem(index, 'pickupDate', e.target.value)}
                className="form-mailer-input"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors?.products?.[index]?.pickupDate && (
                <span className="form-mailer-error">{errors.products[index].pickupDate.message}</span>
              )}
            </div>
          </div>

          {item.productId && pricingHelper.shouldShowSubtotal() && (
            <div style={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e0e0e0', 
              borderRadius: '4px', 
              padding: '12px',
              textAlign: 'right'
            }}>
              <span style={{ color: '#666666', fontSize: '14px' }}>この商品の小計: </span>
              <span style={{ fontWeight: '600', color: '#333333', fontSize: '16px' }}>
                ¥{calculateItemSubtotal(item).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addProductItem}
        className="form-mailer-button-secondary"
        style={{ marginBottom: '20px' }}
      >
        商品を追加
      </button>

      {productItems.length > 0 && calculateTotal() > 0 && pricingHelper.shouldShowTotal() && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          border: '2px solid #333333', 
          borderRadius: '4px', 
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', color: '#333333', marginBottom: '8px' }}>
            合計金額
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#333333' }}>
            ¥{calculateTotal().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}