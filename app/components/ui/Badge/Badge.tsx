import React from 'react'

/**
 * バッジのバリアント
 */
export type BadgeVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'

/**
 * バッジコンポーネントのプロパティ
 */
export interface BadgeProps {
  variant?: BadgeVariant
  pill?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * 再利用可能なバッジコンポーネント
 * Bootstrap 5バッジをベースとした実装
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  pill = false,
  className = '',
  children
}) => {
  const classes = [
    'badge',
    `bg-${variant}`,
    pill ? 'rounded-pill' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {children}
    </span>
  )
}

/**
 * ステータスバッジコンポーネント
 */
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'expired' | 'draft'
  label?: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = ''
}) => {
  const statusConfig = {
    active: { 
      variant: 'success' as BadgeVariant, 
      label: label || '公開中',
      bgClass: 'bg-success-subtle text-success'
    },
    inactive: { 
      variant: 'secondary' as BadgeVariant, 
      label: label || '無効',
      bgClass: 'bg-secondary-subtle text-secondary'
    },
    pending: { 
      variant: 'info' as BadgeVariant, 
      label: label || '開始前',
      bgClass: 'bg-info-subtle text-info'
    },
    expired: { 
      variant: 'danger' as BadgeVariant, 
      label: label || '期限切れ',
      bgClass: 'bg-danger-subtle text-danger'
    },
    draft: { 
      variant: 'warning' as BadgeVariant, 
      label: label || '下書き',
      bgClass: 'bg-warning-subtle text-warning'
    }
  }

  const config = statusConfig[status]

  return (
    <span className={`badge ${config.bgClass} ${className}`}>
      {config.label}
    </span>
  )
}

/**
 * カウントバッジコンポーネント
 */
export interface CountBadgeProps {
  count: number
  max?: number
  variant?: BadgeVariant
  showZero?: boolean
  className?: string
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'primary',
  showZero = false,
  className = ''
}) => {
  if (count === 0 && !showZero) {
    return null
  }

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge variant={variant} pill className={className}>
      {displayCount}
    </Badge>
  )
}

/**
 * 削除可能なバッジコンポーネント
 */
export interface DismissibleBadgeProps extends BadgeProps {
  onDismiss: () => void
  dismissLabel?: string
}

export const DismissibleBadge: React.FC<DismissibleBadgeProps> = ({
  onDismiss,
  dismissLabel = '削除',
  className = '',
  children,
  ...props
}) => {
  return (
    <Badge {...props} className={`d-inline-flex align-items-center ${className}`}>
      <span className="me-1">{children}</span>
      <button
        type="button"
        className="btn-close btn-close-white"
        aria-label={dismissLabel}
        onClick={onDismiss}
        style={{ fontSize: '0.7em' }}
      />
    </Badge>
  )
}

/**
 * アイコン付きバッジコンポーネント
 */
export interface IconBadgeProps extends BadgeProps {
  icon: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  iconPosition = 'left',
  className = '',
  children,
  ...props
}) => {
  return (
    <Badge {...props} className={`d-inline-flex align-items-center ${className}`}>
      {iconPosition === 'left' && <span className="me-1">{icon}</span>}
      {children}
      {iconPosition === 'right' && <span className="ms-1">{icon}</span>}
    </Badge>
  )
}

export default Badge