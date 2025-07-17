import { Customer, LineAuthInfo, LineUserProfile } from '@/types/forms'
import { supabase } from '@/lib/supabase'

export class LineAuthService {
  /**
   * LINE認証情報を顧客データベースに保存
   */
  static async linkLineAuthToCustomer(
    lineUserId: string,
    profile: LineUserProfile,
    customerData: Partial<Customer>
  ): Promise<Customer> {
    try {
      // 既存の顧客をLINE IDで検索
      const existingCustomer = await this.findCustomerByLineId(lineUserId)
      
      if (existingCustomer) {
        // 既存顧客の情報を更新
        const updatedCustomer = await this.updateCustomerWithLineAuth(
          existingCustomer,
          profile,
          customerData
        )
        return updatedCustomer
      } else {
        // 新しい顧客を作成
        const newCustomer = await this.createCustomerWithLineAuth(
          lineUserId,
          profile,
          customerData
        )
        return newCustomer
      }
    } catch (error) {
      console.error('LINE認証情報の連携に失敗しました:', error)
      throw error
    }
  }

  /**
   * LINE IDで顧客を検索
   */
  static async findCustomerByLineId(lineUserId: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('line_user_id', lineUserId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('LINE IDでの顧客検索に失敗しました:', error)
      return null
    }
  }

  /**
   * メールアドレスで顧客を検索
   */
  static async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('メールアドレスでの顧客検索に失敗しました:', error)
      return null
    }
  }

  /**
   * 電話番号で顧客を検索
   */
  static async findCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || null
    } catch (error) {
      console.error('電話番号での顧客検索に失敗しました:', error)
      return null
    }
  }

  /**
   * 既存顧客のLINE認証情報を更新
   */
  static async updateCustomerWithLineAuth(
    existingCustomer: Customer,
    profile: LineUserProfile,
    newCustomerData: Partial<Customer>
  ): Promise<Customer> {
    try {
      // 既存データと新しいデータをマージ
      const mergedData = {
        ...existingCustomer,
        ...newCustomerData,
        line_user_id: profile.userId,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('customers')
        .update(mergedData)
        .eq('id', existingCustomer.id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('顧客のLINE認証情報更新に失敗しました:', error)
      throw error
    }
  }

  /**
   * LINE認証情報と共に新しい顧客を作成
   */
  static async createCustomerWithLineAuth(
    lineUserId: string,
    profile: LineUserProfile,
    customerData: Partial<Customer>
  ): Promise<Customer> {
    try {
      const newCustomerData = {
        ...customerData,
        line_user_id: lineUserId,
        name: customerData.name || profile.displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomerData])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('LINE認証情報付き顧客の作成に失敗しました:', error)
      throw error
    }
  }

  /**
   * 既存顧客を自動認識してLINE認証情報を連携
   */
  static async autoLinkExistingCustomer(
    lineUserId: string,
    profile: LineUserProfile,
    formData: any
  ): Promise<Customer> {
    try {
      // 1. メールアドレスで既存顧客を検索
      if (formData.email) {
        const existingCustomer = await this.findCustomerByEmail(formData.email)
        if (existingCustomer) {
          return await this.updateCustomerWithLineAuth(
            existingCustomer,
            profile,
            formData
          )
        }
      }

      // 2. 電話番号で既存顧客を検索
      if (formData.phone) {
        const existingCustomer = await this.findCustomerByPhone(formData.phone)
        if (existingCustomer) {
          return await this.updateCustomerWithLineAuth(
            existingCustomer,
            profile,
            formData
          )
        }
      }

      // 3. 既存顧客が見つからない場合は新規作成
      return await this.createCustomerWithLineAuth(
        lineUserId,
        profile,
        formData
      )
    } catch (error) {
      console.error('既存顧客の自動認識に失敗しました:', error)
      throw error
    }
  }

  /**
   * LINE認証情報を削除（顧客のline_user_idをnullに設定）
   */
  static async unlinkLineAuth(customerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          line_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)

      if (error) throw error
    } catch (error) {
      console.error('LINE認証情報の削除に失敗しました:', error)
      throw error
    }
  }

  /**
   * 顧客のLINE認証状況を確認
   */
  static async getCustomerLineAuthStatus(customerId: string): Promise<{
    isLinked: boolean
    lineUserId?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('line_user_id')
        .eq('id', customerId)
        .single()

      if (error) throw error

      return {
        isLinked: !!data.line_user_id,
        lineUserId: data.line_user_id
      }
    } catch (error) {
      console.error('LINE認証状況の確認に失敗しました:', error)
      return { isLinked: false }
    }
  }

  /**
   * LINE認証済み顧客の一覧を取得
   */
  static async getLineAuthenticatedCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .not('line_user_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('LINE認証済み顧客の取得に失敗しました:', error)
      return []
    }
  }
}