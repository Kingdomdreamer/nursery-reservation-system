'use client'

import React from 'react'
import { ProductItem, Product } from '../types'

interface Props {
  productItems: ProductItem[]
  setProductItems: (items: ProductItem[]) => void
  availableProducts: Product[]
  errors?: any
}

export default function ProductSelectionForm({ 
  productItems, 
  setProductItems, 
  availableProducts,
  errors 
}: Props) {
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
    <div className="space-y-6">
      <h3 className="section-title">予約内容</h3>
      
      {productItems.map((item, index) => (
        <div key={index} className="product-item">
          <div className="product-header">
            <h4 className="product-title">商品 {index + 1}</h4>
            {productItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeProductItem(index)}
                className="btn-delete"
              >
                🗑️ 削除
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">商品 <span className="text-red-500">*</span></label>
              <select
                value={item.productId}
                onChange={(e) => updateProductItem(index, 'productId', e.target.value)}
                className="form-select"
              >
                <option value="">商品を選択してください</option>
                {availableProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ¥{product.price.toLocaleString()}
                  </option>
                ))}
              </select>
              {errors?.products?.[index]?.productId && (
                <p className="form-error">{errors.products[index].productId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">数量 <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={item.quantity}
                  onChange={(e) => updateProductItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="form-input"
                  placeholder="1"
                />
                {errors?.products?.[index]?.quantity && (
                  <p className="form-error">{errors.products[index].quantity.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">引き取り日 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={item.pickupDate}
                  onChange={(e) => updateProductItem(index, 'pickupDate', e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors?.products?.[index]?.pickupDate && (
                  <p className="form-error">{errors.products[index].pickupDate.message}</p>
                )}
              </div>
            </div>

            {item.productId && (
              <div className="subtotal">
                <span className="text-gray-700">この商品の小計: </span>
                <span className="font-bold text-blue-600">
                  ¥{calculateItemSubtotal(item).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addProductItem}
        className="btn-add"
      >
        ➕ 商品を追加
      </button>

      {productItems.length > 0 && calculateTotal() > 0 && (
        <div className="total-amount">
          <div className="text-xl text-gray-700 mb-2">合計金額</div>
          <div className="text-3xl font-bold text-blue-600">
            ¥{calculateTotal().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}