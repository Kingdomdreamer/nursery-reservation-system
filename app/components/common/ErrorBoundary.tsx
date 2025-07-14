'use client'

import React, { Component, ReactNode } from 'react'
import { Icons, Icon } from '../icons/Icons'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Icon icon={Icons.error} size="lg" className="text-red-600" />
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  エラーが発生しました
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  申し訳ございませんが、予期しないエラーが発生しました。
                  ページを再読み込みするか、しばらく後にもう一度お試しください。
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      エラー詳細 (開発環境のみ表示)
                    </h3>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
                
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 btn-modern btn-outline-modern flex items-center justify-center gap-2"
                  >
                    <Icon icon={Icons.refresh} size="sm" />
                    再試行
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 btn-modern btn-primary-modern flex items-center justify-center gap-2"
                  >
                    <Icon icon={Icons.refresh} size="sm" />
                    ページ再読み込み
                  </button>
                </div>
                
                <p className="mt-4 text-xs text-gray-400">
                  このエラーが続く場合は、システム管理者にお問い合わせください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 軽量版のエラーバウンダリ（インラインエラー表示用）
interface InlineErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface InlineErrorBoundaryState {
  hasError: boolean
}

export class InlineErrorBoundary extends Component<InlineErrorBoundaryProps, InlineErrorBoundaryState> {
  constructor(props: InlineErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): InlineErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('InlineErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-red-700">
            <Icon icon={Icons.error} size="sm" className="mr-2" />
            <span className="text-sm">コンポーネントの読み込みに失敗しました</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}