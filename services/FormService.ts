import { FormTemplate, FormConfiguration, FormField, PricingDisplaySettings } from '../types/forms'
import { supabase } from '../lib/supabase'

export class FormService {
  static async getAllForms(): Promise<FormTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('form_configurations')
        .select(`
          *,
          pricing_display_settings:pricing_display_settings(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('フォーム取得エラー:', error)
        throw error
      }

      // Supabaseのデータを FormTemplate 形式に変換
      return (data || []).map(form => ({
        id: form.id,
        name: form.name,
        description: form.description || '',
        is_active: form.is_active,
        field_count: Array.isArray(form.form_fields) ? form.form_fields.length : 0,
        response_count: 0, // TODO: 実際の回答数を取得
        valid_from: form.valid_from,
        valid_to: form.valid_to,
        created_at: form.created_at,
        updated_at: form.updated_at,
        pricing_display: form.pricing_display_settings?.[0] || {
          show_item_prices: true,
          show_subtotal: true,
          show_total_amount: true,
          show_item_quantity: true,
          pricing_display_mode: 'full'
        }
      }))
    } catch (error) {
      console.error('フォーム一覧の取得に失敗しました:', error)
      // フォールバック: モックデータを返す
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
        }
      ]
    }
  }

  static async createForm(formData: {
    name: string
    description: string
    fields: FormField[]
    isActive: boolean
    validFrom?: string
    validTo?: string
    selectedProducts: string[]
  }): Promise<FormTemplate> {
    try {
      // 1. フォーム設定をSupabaseに保存
      const { data: formConfig, error: formError } = await supabase
        .from('form_configurations')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          form_fields: formData.fields,
          settings: {
            selectedProducts: formData.selectedProducts,
            version: 1
          },
          is_active: formData.isActive,
          valid_from: formData.validFrom || null,
          valid_to: formData.validTo || null,
          version: 1
        })
        .select()
        .single()

      if (formError) {
        console.error('フォーム作成エラー:', formError)
        throw formError
      }

      // 2. デフォルトの価格表示設定を作成
      const { error: pricingError } = await supabase
        .from('pricing_display_settings')
        .insert({
          form_id: formConfig.id,
          show_item_prices: true,
          show_subtotal: true,
          show_total_amount: true,
          show_item_quantity: true,
          pricing_display_mode: 'full'
        })

      if (pricingError) {
        console.warn('価格表示設定の作成に失敗:', pricingError)
      }

      // 3. FormTemplate形式で返す
      const newForm: FormTemplate = {
        id: formConfig.id,
        name: formConfig.name,
        description: formConfig.description || '',
        is_active: formConfig.is_active,
        field_count: formData.fields.length,
        response_count: 0,
        valid_from: formConfig.valid_from,
        valid_to: formConfig.valid_to,
        created_at: formConfig.created_at,
        updated_at: formConfig.updated_at,
        pricing_display: {
          show_item_prices: true,
          show_subtotal: true,
          show_total_amount: true,
          show_item_quantity: true,
          pricing_display_mode: 'full'
        }
      }
      
      console.log('新しいフォームを作成しました:', newForm)
      return newForm

    } catch (error) {
      console.error('フォーム作成に失敗しました:', error)
      throw new Error(`フォーム作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async toggleFormStatus(formId: string, newStatus: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('form_configurations')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)

      if (error) {
        console.error('フォームステータス更新エラー:', error)
        throw error
      }

      console.log(`フォーム ${formId} のステータスを ${newStatus ? '有効' : '無効'} に変更しました`)
    } catch (error) {
      console.error('フォームステータスの更新に失敗しました:', error)
      throw new Error(`フォームステータスの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async deleteForm(formId: string): Promise<void> {
    try {
      // 関連する価格表示設定も削除
      const { error: pricingError } = await supabase
        .from('pricing_display_settings')
        .delete()
        .eq('form_id', formId)

      if (pricingError) {
        console.warn('価格表示設定の削除に失敗:', pricingError)
      }

      // フォーム設定を削除
      const { error } = await supabase
        .from('form_configurations')
        .delete()
        .eq('id', formId)

      if (error) {
        console.error('フォーム削除エラー:', error)
        throw error
      }

      console.log(`フォーム ${formId} を削除しました`)
    } catch (error) {
      console.error('フォーム削除に失敗しました:', error)
      throw new Error(`フォーム削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async getFormById(id: string): Promise<FormConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('form_configurations')
        .select(`
          *,
          pricing_display_settings:pricing_display_settings(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // レコードが見つからない場合
          return null
        }
        console.error('フォーム取得エラー:', error)
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        is_active: data.is_active,
        fields: data.form_fields || [],
        pricing_display: data.pricing_display_settings?.[0] || {
          show_item_prices: true,
          show_subtotal: true,
          show_total_amount: true,
          show_item_quantity: true,
          pricing_display_mode: 'full'
        },
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('フォーム取得に失敗しました:', error)
      return null
    }
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
    try {
      const { error } = await supabase
        .from('pricing_display_settings')
        .upsert({
          form_id: formId,
          show_item_prices: settings.show_item_prices,
          show_subtotal: settings.show_subtotal,
          show_total_amount: settings.show_total_amount,
          show_item_quantity: settings.show_item_quantity,
          pricing_display_mode: settings.pricing_display_mode,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('価格表示設定更新エラー:', error)
        throw error
      }

      console.log(`価格表示設定を更新しました - フォーム ${formId}:`, settings)
    } catch (error) {
      console.error('価格表示設定の更新に失敗しました:', error)
      throw new Error(`価格表示設定の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async getPricingDisplaySettings(formId: string): Promise<PricingDisplaySettings> {
    try {
      const { data, error } = await supabase
        .from('pricing_display_settings')
        .select('*')
        .eq('form_id', formId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // レコードが見つからない場合はデフォルト設定を返す
          return {
            show_item_prices: true,
            show_subtotal: true,
            show_total_amount: true,
            show_item_quantity: true,
            pricing_display_mode: 'full'
          }
        }
        console.error('価格表示設定取得エラー:', error)
        throw error
      }

      return {
        show_item_prices: data.show_item_prices,
        show_subtotal: data.show_subtotal,
        show_total_amount: data.show_total_amount,
        show_item_quantity: data.show_item_quantity,
        pricing_display_mode: data.pricing_display_mode
      }
    } catch (error) {
      console.error('価格表示設定の取得に失敗しました:', error)
      // フォールバック: デフォルト設定を返す
      return {
        show_item_prices: true,
        show_subtotal: true,
        show_total_amount: true,
        show_item_quantity: true,
        pricing_display_mode: 'full'
      }
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