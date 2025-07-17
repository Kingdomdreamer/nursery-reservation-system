/**
 * 確認画面用のユーティリティ関数集
 */

import { PricingDisplaySettings } from '@/types/forms'

export interface ValidationError {
  field: string
  message: string
}

export interface ConfirmationValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * 予約データの最終バリデーション
 */
export function validateReservationData(reservationData: any): ConfirmationValidationResult {
  const errors: ValidationError[] = []

  // 必須フィールドのバリデーション
  if (!reservationData.name?.trim()) {
    errors.push({ field: 'name', message: 'お名前は必須です' })
  }

  if (!reservationData.phone?.trim()) {
    errors.push({ field: 'phone', message: '電話番号は必須です' })
  }

  if (!reservationData.products || reservationData.products.length === 0) {
    errors.push({ field: 'products', message: '商品を選択してください' })
  }

  // 商品の個別バリデーション
  if (reservationData.products) {
    reservationData.products.forEach((product: any, index: number) => {
      if (!product.productId) {
        errors.push({ field: `product_${index}_id`, message: `商品${index + 1}の選択が無効です` })
      }
      if (!product.quantity || product.quantity < 1) {
        errors.push({ field: `product_${index}_quantity`, message: `商品${index + 1}の数量は1以上にしてください` })
      }
      if (!product.pickupDate) {
        errors.push({ field: `product_${index}_date`, message: `商品${index + 1}の引き取り日を選択してください` })
      }
    })
  }

  // 電話番号の形式チェック
  if (reservationData.phone && !isValidPhoneNumber(reservationData.phone)) {
    errors.push({ field: 'phone', message: '電話番号の形式が正しくありません' })
  }

  // 郵便番号の形式チェック（入力されている場合のみ）
  if (reservationData.zipcode && !isValidZipCode(reservationData.zipcode)) {
    errors.push({ field: 'zipcode', message: '郵便番号の形式が正しくありません（例：123-4567）' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 電話番号の形式バリデーション
 */
function isValidPhoneNumber(phone: string): boolean {
  // 日本の電話番号の基本的なパターン
  const phoneRegex = /^(\d{2,4}-?\d{1,4}-?\d{4}|\d{10,11})$/
  return phoneRegex.test(phone.replace(/[^\d-]/g, ''))
}

/**
 * 郵便番号の形式バリデーション
 */
function isValidZipCode(zipcode: string): boolean {
  const zipcodeRegex = /^\d{3}-?\d{4}$/
  return zipcodeRegex.test(zipcode)
}

/**
 * 価格表示設定に基づく表示判定
 */
export class PricingDisplayHelper {
  private settings: PricingDisplaySettings | undefined

  constructor(settings?: PricingDisplaySettings) {
    this.settings = settings
  }

  /**
   * 価格を表示するかどうか
   */
  shouldShowPricing(): boolean {
    if (!this.settings) return true
    return this.settings.pricing_display_mode !== 'hidden'
  }

  /**
   * 商品価格を表示するかどうか
   */
  shouldShowItemPrices(): boolean {
    if (!this.settings) return true
    return this.settings.pricing_display_mode === 'full' || 
           (this.settings.pricing_display_mode === 'custom' && this.settings.show_item_prices)
  }

  /**
   * 数量を表示するかどうか
   */
  shouldShowQuantity(): boolean {
    if (!this.settings) return true
    return this.settings.pricing_display_mode === 'full' || 
           (this.settings.pricing_display_mode === 'custom' && this.settings.show_item_quantity)
  }

  /**
   * 小計を表示するかどうか
   */
  shouldShowSubtotal(): boolean {
    if (!this.settings) return true
    return this.settings.pricing_display_mode === 'full' || 
           (this.settings.pricing_display_mode === 'custom' && this.settings.show_subtotal)
  }

  /**
   * 合計金額を表示するかどうか
   */
  shouldShowTotal(): boolean {
    if (!this.settings) return true
    return this.settings.pricing_display_mode !== 'hidden' &&
           (this.settings.pricing_display_mode === 'full' || 
            this.settings.pricing_display_mode === 'summary' ||
            (this.settings.pricing_display_mode === 'custom' && this.settings.show_total_amount))
  }

  /**
   * 表示モードの説明テキストを取得
   */
  getDisplayModeDescription(): string {
    if (!this.settings) return '標準表示'
    
    switch (this.settings.pricing_display_mode) {
      case 'full':
        return '詳細表示 - すべての価格情報を表示'
      case 'summary':
        return '合計のみ表示 - 合計金額のみを表示'
      case 'hidden':
        return '価格非表示 - 価格情報を表示しません'
      case 'custom':
        return 'カスタム表示 - 個別設定に基づいて表示'
      default:
        return '標準表示'
    }
  }
}

/**
 * 予約内容のサマリーテキストを生成
 */
export function generateReservationSummary(reservationData: any, products: any[]): string {
  const productNames = reservationData.products?.map((item: any) => {
    const product = products.find(p => p.id === item.productId)
    return `${product?.name || '不明な商品'} × ${item.quantity}`
  }).join(', ') || '商品なし'

  return `${reservationData.name}様 - ${productNames}`
}

/**
 * 引き取り日の一覧を取得
 */
export function getPickupDates(reservationData: any): string[] {
  if (!reservationData.products) return []
  
  const dates = reservationData.products
    .map((item: any) => item.pickupDate)
    .filter((date: string) => date) as string[]
  
  // 重複を削除してソート
  return [...new Set(dates)].sort()
}

/**
 * 合計金額を計算
 */
export function calculateTotalAmount(reservationData: any, products: any[]): number {
  if (!reservationData.products) return 0
  
  return reservationData.products.reduce((total: number, item: any) => {
    const product = products.find(p => p.id === item.productId)
    return total + (product ? product.price * item.quantity : 0)
  }, 0)
}

/**
 * フォーマット済みの住所を取得
 */
export function getFormattedAddress(reservationData: any): string {
  const parts = [
    reservationData.prefecture,
    reservationData.city,
    reservationData.town,
    reservationData.addressDetail
  ].filter(Boolean)
  
  return parts.join('')
}

/**
 * エラーメッセージをフォーマット
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  
  if (errors.length === 1) {
    return errors[0].message
  }
  
  return `入力内容に${errors.length}個のエラーがあります：\n` + 
         errors.map(error => `• ${error.message}`).join('\n')
}

/**
 * 確認画面の状態管理
 */
export class ConfirmationScreenState {
  private isSubmitting = false
  private error: string | null = null

  setSubmitting(submitting: boolean): void {
    this.isSubmitting = submitting
  }

  isCurrentlySubmitting(): boolean {
    return this.isSubmitting
  }

  setError(error: string | null): void {
    this.error = error
  }

  getError(): string | null {
    return this.error
  }

  clearError(): void {
    this.error = null
  }

  reset(): void {
    this.isSubmitting = false
    this.error = null
  }
}