import { supabase } from '../../../lib/supabase'

export interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    contact_email: string
    contact_phone: string
  }
  notifications: {
    email_enabled: boolean
    line_enabled: boolean
    sms_enabled: boolean
    reminder_hours: number
  }
  business: {
    business_hours_start: string
    business_hours_end: string
    business_days: string[]
    holiday_mode: boolean
  }
  advanced: {
    auto_confirm_orders: boolean
    require_phone_verification: boolean
    max_reservation_days: number
    default_pickup_duration: number
  }
}

export class SettingsService {
  private static readonly SETTING_KEYS = {
    GENERAL: 'general_settings',
    NOTIFICATIONS: 'notification_settings',
    BUSINESS: 'business_settings',
    ADVANCED: 'advanced_settings'
  }

  static async getSettings(): Promise<SystemSettings> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', Object.values(this.SETTING_KEYS))

      if (error) {
        console.error('設定の取得に失敗:', error)
        return this.getDefaultSettings()
      }

      const settings = this.getDefaultSettings()
      
      if (data) {
        data.forEach(row => {
          const value = typeof row.setting_value === 'string' 
            ? JSON.parse(row.setting_value) 
            : row.setting_value

          switch (row.setting_key) {
            case this.SETTING_KEYS.GENERAL:
              settings.general = { ...settings.general, ...value }
              break
            case this.SETTING_KEYS.NOTIFICATIONS:
              settings.notifications = { ...settings.notifications, ...value }
              break
            case this.SETTING_KEYS.BUSINESS:
              settings.business = { ...settings.business, ...value }
              break
            case this.SETTING_KEYS.ADVANCED:
              settings.advanced = { ...settings.advanced, ...value }
              break
          }
        })
      }

      return settings
    } catch (error) {
      console.error('設定の取得中にエラーが発生:', error)
      return this.getDefaultSettings()
    }
  }

  static async saveSettings(settings: SystemSettings): Promise<void> {
    try {
      const settingsToSave = [
        {
          setting_key: this.SETTING_KEYS.GENERAL,
          setting_value: JSON.stringify(settings.general)
        },
        {
          setting_key: this.SETTING_KEYS.NOTIFICATIONS,
          setting_value: JSON.stringify(settings.notifications)
        },
        {
          setting_key: this.SETTING_KEYS.BUSINESS,
          setting_value: JSON.stringify(settings.business)
        },
        {
          setting_key: this.SETTING_KEYS.ADVANCED,
          setting_value: JSON.stringify(settings.advanced)
        }
      ]

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(setting, { onConflict: 'setting_key' })

        if (error) {
          throw error
        }
      }

      console.log('設定が正常に保存されました')
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      throw new Error('設定の保存に失敗しました')
    }
  }

  private static getDefaultSettings(): SystemSettings {
    return {
      general: {
        site_name: 'ベジライス予約システム',
        site_description: 'LINE ミニアプリ対応の種苗店予約システム',
        contact_email: 'contact@vegirice.com',
        contact_phone: '03-1234-5678'
      },
      notifications: {
        email_enabled: true,
        line_enabled: true,
        sms_enabled: false,
        reminder_hours: 24
      },
      business: {
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        business_days: ['月', '火', '水', '木', '金', '土'],
        holiday_mode: false
      },
      advanced: {
        auto_confirm_orders: false,
        require_phone_verification: true,
        max_reservation_days: 30,
        default_pickup_duration: 60
      }
    }
  }

  // 設定の初期化（初回セットアップ時）
  static async initializeSettings(): Promise<void> {
    try {
      const defaultSettings = this.getDefaultSettings()
      await this.saveSettings(defaultSettings)
    } catch (error) {
      console.error('設定の初期化に失敗:', error)
      throw new Error('設定の初期化に失敗しました')
    }
  }

  // 特定の設定カテゴリの取得
  static async getSettingsByCategory(category: 'general' | 'notifications' | 'business' | 'advanced'): Promise<any> {
    try {
      const settingKey = this.SETTING_KEYS[category.toUpperCase() as keyof typeof this.SETTING_KEYS]
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', settingKey)
        .single()

      if (error) {
        console.error(`${category}設定の取得に失敗:`, error)
        return this.getDefaultSettings()[category]
      }

      return data ? JSON.parse(data.setting_value) : this.getDefaultSettings()[category]
    } catch (error) {
      console.error(`${category}設定の取得中にエラーが発生:`, error)
      return this.getDefaultSettings()[category]
    }
  }

  // 営業時間の確認
  static async isBusinessOpen(): Promise<boolean> {
    try {
      const businessSettings = await this.getSettingsByCategory('business')
      
      if (businessSettings.holiday_mode) {
        return false
      }

      const now = new Date()
      const today = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
      
      if (!businessSettings.business_days.includes(today)) {
        return false
      }

      const currentTime = now.getHours() * 100 + now.getMinutes()
      const startTime = parseInt(businessSettings.business_hours_start.replace(':', ''))
      const endTime = parseInt(businessSettings.business_hours_end.replace(':', ''))

      return currentTime >= startTime && currentTime <= endTime
    } catch (error) {
      console.error('営業時間の確認中にエラーが発生:', error)
      return false
    }
  }

  // 予約可能日の計算
  static async getMaxReservationDate(): Promise<Date> {
    try {
      const advancedSettings = await this.getSettingsByCategory('advanced')
      const maxDays = advancedSettings.max_reservation_days || 30
      
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + maxDays)
      
      return maxDate
    } catch (error) {
      console.error('最大予約日の計算中にエラーが発生:', error)
      const fallbackDate = new Date()
      fallbackDate.setDate(fallbackDate.getDate() + 30)
      return fallbackDate
    }
  }
}