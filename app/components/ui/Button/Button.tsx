import React from 'react'

/**
 * ボタンのバリアント
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'light' 
  | 'dark'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'outline-light'
  | 'outline-dark'

/**
 * ボタンのサイズ
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * ボタンコンポーネントのプロパティ
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}

/**
 * 再利用可能なボタンコンポーネント
 * Bootstrap 5クラスをベースとした統一されたスタイル
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  // クラス名の生成
  const baseClass = 'btn'
  const variantClass = `btn-${variant}`
  const sizeClass = size !== 'md' ? `btn-${size}` : ''
  const fullWidthClass = fullWidth ? 'w-100' : ''
  const loadingClass = loading ? 'position-relative' : ''
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ')

  // アイコンの表示
  const renderIcon = () => {
    if (loading) {
      return (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      )
    }
    
    if (icon) {
      const iconClass = iconPosition === 'left' ? 'me-2' : 'ms-2'
      return <span className={iconClass}>{icon}</span>
    }
    
    return null
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  )
}

/**
 * プライマリボタン（便利なエイリアス）
 */
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
)

/**
 * セカンダリボタン（便利なエイリアス）
 */
export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
)

/**
 * デンジャーボタン（便利なエイリアス）
 */
export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
)

/**
 * アウトラインプライマリボタン（便利なエイリアス）
 */
export const OutlinePrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline-primary" {...props} />
)

export default Button