/**
 * 商品関連コンポーネント用の共通エラー境界
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProductErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Product component error:', error);
    console.error('Error info:', errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600 font-medium">
            商品の表示中にエラーが発生しました
          </div>
          <div className="text-red-500 text-sm mt-1">
            ページを再読み込みしてもエラーが続く場合は、システム管理者にお問い合わせください。
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm text-red-600 underline hover:text-red-700"
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}