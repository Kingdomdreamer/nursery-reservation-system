import { supabase } from '../../../lib/supabase'
import { StatusUtils } from '../utils/StatusUtils'
import { FormConfiguration } from '../../../lib/supabase'

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date'
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

export interface FormConfig {
  id?: string
  name: string
  description: string
  fields: FormField[]
  isActive: boolean
  validFrom?: string
  validTo?: string
  selectedProducts?: string[]
}

export class FormService {
  static async getAllForms() {
    const { data, error } = await supabase
      .from('form_configurations')
      .select(`
        id,
        name,
        description,
        form_fields,
        settings,
        is_active,
        valid_from,
        valid_to,
        version,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return data?.map(form => ({
      ...form,
      settings: form.settings || {},
      version: form.version || 1,
      field_count: form.form_fields?.fields?.length || 0,
      response_count: 0 // TODO: 実際の回答数を取得
    })) || []
  }

  static async createForm(formConfig: FormConfig) {
    const { data, error } = await supabase
      .from('form_configurations')
      .insert([{
        name: formConfig.name,
        description: formConfig.description,
        form_fields: { fields: formConfig.fields },
        is_active: formConfig.isActive,
        valid_from: formConfig.validFrom || null,
        valid_to: formConfig.validTo || null,
        selected_products: formConfig.selectedProducts || []
      }])
      .select()

    if (error) throw error
    return data[0]
  }

  static async updateForm(id: string, formConfig: Partial<FormConfig>) {
    const updateData: any = {}
    
    if (formConfig.name) updateData.name = formConfig.name
    if (formConfig.description) updateData.description = formConfig.description
    if (formConfig.fields) updateData.form_fields = { fields: formConfig.fields }
    if (formConfig.isActive !== undefined) updateData.is_active = formConfig.isActive
    if (formConfig.validFrom !== undefined) updateData.valid_from = formConfig.validFrom || null
    if (formConfig.validTo !== undefined) updateData.valid_to = formConfig.validTo || null
    if (formConfig.selectedProducts) updateData.selected_products = formConfig.selectedProducts

    const { data, error } = await supabase
      .from('form_configurations')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  }

  static async deleteForm(id: string) {
    const { error } = await supabase
      .from('form_configurations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  static async getFormById(id: string) {
    const { data, error } = await supabase
      .from('form_configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async toggleFormStatus(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('form_configurations')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
    return true
  }

  static isFormAccessible(form: FormConfiguration): boolean {
    if (!form.is_active) return false

    const now = new Date()
    const validFrom = form.valid_from ? new Date(form.valid_from) : null
    const validTo = form.valid_to ? new Date(form.valid_to) : null

    if (validFrom && now < validFrom) return false
    if (validTo && now > validTo) return false

    return true
  }

  static getFormStatus(form: FormConfiguration): 'active' | 'inactive' | 'pending' | 'expired' {
    if (!form.is_active) return 'inactive'

    const now = new Date()
    const validFrom = form.valid_from ? new Date(form.valid_from) : null
    const validTo = form.valid_to ? new Date(form.valid_to) : null

    if (validFrom && now < validFrom) return 'pending'
    if (validTo && now > validTo) return 'expired'

    return 'active'
  }

  static getValidityPeriodText(validFrom?: string, validTo?: string): string {
    return StatusUtils.getValidityPeriodText(validFrom, validTo)
  }
}