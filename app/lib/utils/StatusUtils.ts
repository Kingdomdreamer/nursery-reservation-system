export class StatusUtils {
  static getStatusBadgeClasses(status: string): { bg: string; text: string; label: string } {
    const statusConfig = {
      'active': { bg: 'bg-green-100', text: 'text-green-800', label: 'アクティブ' },
      'inactive': { bg: 'bg-gray-100', text: 'text-gray-800', label: '無効' },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', label: '保留中' },
      'confirmed': { bg: 'bg-green-100', text: 'text-green-800', label: '確定' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'キャンセル' },
      'completed': { bg: 'bg-purple-100', text: 'text-purple-800', label: '完了' },
      'expired': { bg: 'bg-red-100', text: 'text-red-800', label: '期限切れ' },
      'preparing': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '準備中' }
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
  }

  static formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    if (!dateString) return ''
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }
    
    return new Date(dateString).toLocaleDateString('ja-JP', defaultOptions)
  }

  static formatDateTime(dateString: string): string {
    if (!dateString) return ''
    
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  static formatPrice(price: number): string {
    return `¥${price.toLocaleString()}`
  }

  static isDateInRange(date: Date, startDate?: Date, endDate?: Date): boolean {
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  }

  static calculateDaysUntil(targetDate: string): number {
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  static getValidityPeriodText(validFrom?: string, validTo?: string): string {
    if (!validFrom && !validTo) {
      return '期限なし'
    }

    if (validFrom && validTo) {
      return `${this.formatDate(validFrom)} - ${this.formatDate(validTo)}`
    }

    if (validFrom) {
      return `${this.formatDate(validFrom)}から`
    }

    if (validTo) {
      return `${this.formatDate(validTo)}まで`
    }

    return '期限なし'
  }
}