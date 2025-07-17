import { FormTemplate, FormConfiguration, FormField, PricingDisplaySettings } from '@/types/forms'

export class FormService {
  static async getAllForms(): Promise<FormTemplate[]> {
    // Mock implementation
    return [
      {
        id: '1',
        name: 'お問い合わせフォーム',
        description: '一般的なお問い合わせ用のフォームです',
        is_active: true,
        field_count: 5,
        response_count: 12,
        valid_from: '2024-01-01T00:00:00Z',
        valid_to: '2024-12-31T23:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        pricing_display: {
          show_item_prices: true,
          show_subtotal: true,
          show_total_amount: true,
          show_item_quantity: true,
          pricing_display_mode: 'full'
        }
      },
      {
        id: '2',
        name: '商品予約フォーム',
        description: '商品の予約を受け付けるフォームです',
        is_active: false,
        field_count: 8,
        response_count: 5,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-20T15:45:00Z',
        pricing_display: {
          show_item_prices: false,
          show_subtotal: false,
          show_total_amount: true,
          show_item_quantity: false,
          pricing_display_mode: 'summary'
        }
      }
    ]
  }

  static async getFormById(id: string): Promise<FormConfiguration | null> {
    // Mock implementation
    return {
      id,
      name: 'サンプルフォーム',
      description: 'サンプルの説明',
      is_active: true,
      fields: [],
      pricing_display: {
        show_item_prices: true,
        show_subtotal: true,
        show_total_amount: true,
        show_item_quantity: true,
        pricing_display_mode: 'full'
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }

  static async createForm(formData: any): Promise<FormConfiguration> {
    // Mock implementation
    const newForm: FormConfiguration = {
      id: `form_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      is_active: formData.isActive || false,
      valid_from: formData.validFrom,
      valid_to: formData.validTo,
      fields: formData.fields || [],
      pricing_display: formData.pricing_display || {
        show_item_prices: true,
        show_subtotal: true,
        show_total_amount: true,
        show_item_quantity: true,
        pricing_display_mode: 'full'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return newForm
  }

  static async toggleFormStatus(formId: string, newStatus: boolean): Promise<void> {
    // Mock implementation
    console.log(`Toggling form ${formId} status to ${newStatus}`)
  }

  static async deleteForm(formId: string): Promise<void> {
    // Mock implementation
    console.log(`Deleting form ${formId}`)
  }

  static getFormStatus(form: FormTemplate | FormConfiguration): 'active' | 'inactive' | 'pending' | 'expired' {
    if (!form.is_active) return 'inactive'
    
    const now = new Date()
    
    if (form.valid_from) {
      const validFrom = new Date(form.valid_from)
      if (now < validFrom) return 'pending'
    }
    
    if (form.valid_to) {
      const validTo = new Date(form.valid_to)
      if (now > validTo) return 'expired'
    }
    
    return 'active'
  }

  static getValidityPeriodText(validFrom?: string, validTo?: string): string {
    if (!validFrom && !validTo) return '無期限'
    
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('ja-JP')
    }
    
    if (validFrom && validTo) {
      return `${formatDate(validFrom)} - ${formatDate(validTo)}`
    } else if (validFrom) {
      return `${formatDate(validFrom)} -`
    } else if (validTo) {
      return `- ${formatDate(validTo)}`
    }
    
    return '無期限'
  }

  // 価格表示設定関連のメソッド
  static async updatePricingDisplaySettings(
    formId: string, 
    settings: PricingDisplaySettings
  ): Promise<void> {
    // Mock implementation
    console.log(`Updating pricing display settings for form ${formId}:`, settings)
  }

  static async getPricingDisplaySettings(formId: string): Promise<PricingDisplaySettings> {
    // Mock implementation - 実際の実装では、フォームIDに基づいて設定を取得
    return {
      show_item_prices: true,
      show_subtotal: true,
      show_total_amount: true,
      show_item_quantity: true,
      pricing_display_mode: 'full'
    }
  }

  static getPricingDisplayModeLabel(mode: PricingDisplaySettings['pricing_display_mode']): string {
    const labels = {
      full: '詳細表示',
      summary: '合計のみ',
      hidden: '非表示',
      custom: 'カスタム'
    }
    return labels[mode]
  }

  static getPricingDisplayModeDescription(mode: PricingDisplaySettings['pricing_display_mode']): string {
    const descriptions = {
      full: '商品価格、小計、合計をすべて表示',
      summary: '合計金額のみを表示',
      hidden: '価格情報を表示しない',
      custom: 'カスタム設定で表示項目を選択'
    }
    return descriptions[mode]
  }

  static getPricingDisplayStatistics(forms: FormTemplate[]): {
    total: number
    byMode: Record<string, number>
    showingPrices: number
    hidingPrices: number
  } {
    const stats = {
      total: forms.length,
      byMode: {
        full: 0,
        summary: 0,
        hidden: 0,
        custom: 0
      },
      showingPrices: 0,
      hidingPrices: 0
    }

    forms.forEach(form => {
      if (form.pricing_display) {
        stats.byMode[form.pricing_display.pricing_display_mode]++
        
        if (form.pricing_display.pricing_display_mode === 'hidden') {
          stats.hidingPrices++
        } else {
          stats.showingPrices++
        }
      }
    })

    return stats
  }
}