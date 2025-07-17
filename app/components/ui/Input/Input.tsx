import React, { forwardRef } from 'react'

/**
 * 入力コンポーネントのサイズ
 */
export type InputSize = 'sm' | 'md' | 'lg'

/**
 * 入力コンポーネントのバリアント
 */
export type InputVariant = 'default' | 'valid' | 'invalid'

/**
 * 基本入力コンポーネントのプロパティ
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  size?: InputSize
  variant?: InputVariant
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  fullWidth?: boolean
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
  helperClassName?: string
}

/**
 * 再利用可能な入力コンポーネント
 * Bootstrap 5フォームコントロールをベースとした実装
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  helperClassName = '',
  className = '',
  id,
  required = false,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  // クラス名の生成
  const inputClasses = [
    'form-control',
    size !== 'md' ? `form-control-${size}` : '',
    variant === 'valid' ? 'is-valid' : '',
    variant === 'invalid' || error ? 'is-invalid' : '',
    fullWidth ? 'w-100' : '',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'mb-3',
    containerClassName
  ].filter(Boolean).join(' ')

  const labelClasses = [
    'form-label',
    labelClassName
  ].filter(Boolean).join(' ')

  const errorClasses = [
    'invalid-feedback',
    errorClassName
  ].filter(Boolean).join(' ')

  const helperClasses = [
    'form-text',
    helperClassName
  ].filter(Boolean).join(' ')

  // アイコンがある場合の入力グループ
  const renderInputWithIcons = () => {
    if (leftIcon || rightIcon || loading) {
      return (
        <div className="input-group">
          {leftIcon && (
            <span className="input-group-text">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          {loading && (
            <span className="input-group-text">
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </span>
          )}
          {rightIcon && !loading && (
            <span className="input-group-text">
              {rightIcon}
            </span>
          )}
        </div>
      )
    }

    return (
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
    )
  }

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      {renderInputWithIcons()}
      
      {error && (
        <div id={`${inputId}-error`} className={errorClasses}>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${inputId}-help`} className={helperClasses}>
          {helperText}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

/**
 * テキストエリアコンポーネントのプロパティ
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  size?: InputSize
  variant?: InputVariant
  fullWidth?: boolean
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
  helperClassName?: string
}

/**
 * テキストエリアコンポーネント
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  helperClassName = '',
  className = '',
  id,
  required = false,
  rows = 3,
  ...props
}, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  // クラス名の生成
  const textareaClasses = [
    'form-control',
    size !== 'md' ? `form-control-${size}` : '',
    variant === 'valid' ? 'is-valid' : '',
    variant === 'invalid' || error ? 'is-invalid' : '',
    fullWidth ? 'w-100' : '',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'mb-3',
    containerClassName
  ].filter(Boolean).join(' ')

  const labelClasses = [
    'form-label',
    labelClassName
  ].filter(Boolean).join(' ')

  const errorClasses = [
    'invalid-feedback',
    errorClassName
  ].filter(Boolean).join(' ')

  const helperClasses = [
    'form-text',
    helperClassName
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={inputId}
        className={textareaClasses}
        rows={rows}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      
      {error && (
        <div id={`${inputId}-error`} className={errorClasses}>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${inputId}-help`} className={helperClasses}>
          {helperText}
        </div>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

/**
 * セレクトコンポーネントのプロパティ
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  size?: InputSize
  variant?: InputVariant
  fullWidth?: boolean
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
  helperClassName?: string
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

/**
 * セレクトコンポーネント
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  helperClassName = '',
  className = '',
  id,
  required = false,
  options = [],
  placeholder,
  children,
  ...props
}, ref) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  // クラス名の生成
  const selectClasses = [
    'form-select',
    size !== 'md' ? `form-select-${size}` : '',
    variant === 'valid' ? 'is-valid' : '',
    variant === 'invalid' || error ? 'is-invalid' : '',
    fullWidth ? 'w-100' : '',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'mb-3',
    containerClassName
  ].filter(Boolean).join(' ')

  const labelClasses = [
    'form-label',
    labelClassName
  ].filter(Boolean).join(' ')

  const errorClasses = [
    'invalid-feedback',
    errorClassName
  ].filter(Boolean).join(' ')

  const helperClasses = [
    'form-text',
    helperClassName
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        id={inputId}
        className={selectClasses}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
        {children}
      </select>
      
      {error && (
        <div id={`${inputId}-error`} className={errorClasses}>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${inputId}-help`} className={helperClasses}>
          {helperText}
        </div>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Input