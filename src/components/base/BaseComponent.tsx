/**
 * ベースコンポーネント - オブジェクト指向設計の基底クラス
 * 全コンポーネントで共通の機能を提供
 */

import React from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

/**
 * ベースプロパティインターフェース
 */
export interface BaseComponentProps {
  id?: string;
  className?: string;
  testId?: string;
  isLoading?: boolean;
  error?: string | Error | null;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
}

/**
 * ベースコンポーネント抽象クラス
 * 全てのコンポーネントがこれを継承することで一貫性を確保
 */
export abstract class BaseComponent<P extends BaseComponentProps = BaseComponentProps> 
  extends React.Component<P> {
  
  protected componentName: string = this.constructor.name;

  /**
   * エラーハンドリング
   */
  protected handleError = (error: Error) => {
    console.error(`[${this.componentName}] Error:`, error);
    if (this.props.onError) {
      this.props.onError(error);
    }
  };

  /**
   * ローディング状態の描画
   */
  protected renderLoading(): React.ReactNode {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  /**
   * エラー状態の描画
   */
  protected renderError(error: string | Error | null): React.ReactNode {
    if (!error) return null;
    
    return (
      <ErrorDisplay
        error={typeof error === 'string' ? error : error.message}
        variant="error"
        size="medium"
      />
    );
  }

  /**
   * 基本クラス名の生成
   */
  protected getBaseClassName(): string {
    const { className = '' } = this.props;
    return `${this.componentName.toLowerCase()} ${className}`.trim();
  }

  /**
   * テスト用のプロパティ生成
   */
  protected getTestProps(): { 'data-testid'?: string } {
    const { testId } = this.props;
    return testId ? { 'data-testid': testId } : {};
  }

  /**
   * 抽象メソッド - 継承クラスで実装必須
   */
  protected abstract renderContent(): React.ReactNode;

  /**
   * 最終的な描画メソッド
   */
  render(): React.ReactNode {
    const { isLoading, error } = this.props;

    if (isLoading) {
      return this.renderLoading();
    }

    if (error) {
      return this.renderError(error);
    }

    return (
      <ErrorBoundary>
        <div
          className={this.getBaseClassName()}
          {...this.getTestProps()}
        >
          {this.renderContent()}
        </div>
      </ErrorBoundary>
    );
  }
}

/**
 * 関数コンポーネント用のベースフック
 */
export const useBaseComponent = (componentName: string, props: BaseComponentProps) => {
  const { isLoading, error, onError, className = '', testId } = props;

  const handleError = React.useCallback((error: Error) => {
    console.error(`[${componentName}] Error:`, error);
    if (onError) {
      onError(error);
    }
  }, [componentName, onError]);

  const getBaseClassName = React.useCallback(() => {
    return `${componentName.toLowerCase()} ${className}`.trim();
  }, [componentName, className]);

  const getTestProps = React.useCallback(() => {
    return testId ? { 'data-testid': testId } : {};
  }, [testId]);

  const renderLoading = React.useCallback(() => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">読み込み中...</span>
    </div>
  ), []);

  const renderError = React.useCallback((error: string | Error | null) => {
    if (!error) return null;
    
    return (
      <ErrorDisplay
        error={typeof error === 'string' ? error : error.message}
        variant="error"
        size="medium"
      />
    );
  }, []);

  return {
    isLoading,
    error,
    handleError,
    getBaseClassName,
    getTestProps,
    renderLoading,
    renderError
  };
};

/**
 * HOC: ベース機能をラップ
 */
export const withBaseComponent = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const WithBaseComponent = React.forwardRef<unknown, P & BaseComponentProps>((props, ref) => {
    const {
      isLoading,
      error,
      renderLoading,
      renderError,
      getBaseClassName,
      getTestProps
    } = useBaseComponent(componentName || WrappedComponent.displayName || 'Component', props);

    if (isLoading) {
      return renderLoading();
    }

    if (error) {
      return renderError(error);
    }

    return (
      <ErrorBoundary>
        <div className={getBaseClassName()} {...getTestProps()}>
          <WrappedComponent {...(props as P)} ref={ref} />
        </div>
      </ErrorBoundary>
    );
  });

  WithBaseComponent.displayName = `withBaseComponent(${componentName || WrappedComponent.displayName || 'Component'})`;

  return WithBaseComponent;
};