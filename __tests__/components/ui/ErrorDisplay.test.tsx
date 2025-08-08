/**
 * ErrorDisplay コンポーネントのテスト
 * 統一エラー表示UIの動作確認
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorDisplay,
  ErrorBoundaryDisplay,
  FormError,
  ApiError,
  ErrorInfo
} from '@/components/ui/ErrorDisplay';

describe('ErrorDisplay', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Display', () => {
    it('should render error message from string', () => {
      render(<ErrorDisplay error="テストエラーメッセージ" />);
      
      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Alert icon
    });

    it('should render error message from ErrorInfo object', () => {
      const errorInfo: ErrorInfo = {
        message: 'テストエラーメッセージ',
        code: 'TEST_ERROR',
        details: 'エラーの詳細情報',
        timestamp: '2025-08-07T12:00:00.000Z'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
      expect(screen.getByText('TEST_ERROR')).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = render(
        <ErrorDisplay error="エラーメッセージ" variant="error" />
      );
      
      let container = screen.getByText('エラーメッセージ').closest('div');
      expect(container).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

      rerender(<ErrorDisplay error="警告メッセージ" variant="warning" />);
      container = screen.getByText('警告メッセージ').closest('div');
      expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

      rerender(<ErrorDisplay error="情報メッセージ" variant="info" />);
      container = screen.getByText('情報メッセージ').closest('div');
      expect(container).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(
        <ErrorDisplay error="エラーメッセージ" size="small" />
      );
      
      let container = screen.getByText('エラーメッセージ').closest('div');
      expect(container).toHaveClass('p-2', 'text-sm');

      rerender(<ErrorDisplay error="エラーメッセージ" size="medium" />);
      container = screen.getByText('エラーメッセージ').closest('div');
      expect(container).toHaveClass('p-4', 'text-base');

      rerender(<ErrorDisplay error="エラーメッセージ" size="large" />);
      container = screen.getByText('エラーメッセージ').closest('div');
      expect(container).toHaveClass('p-6', 'text-lg');
    });
  });

  describe('Error Code Handling', () => {
    it('should display friendly message for known error codes', () => {
      const errorInfo: ErrorInfo = {
        message: 'Original technical message',
        code: 'VALIDATION_ERROR'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('入力内容に問題があります')).toBeInTheDocument();
      expect(screen.queryByText('Original technical message')).not.toBeInTheDocument();
    });

    it('should display original message for unknown error codes', () => {
      const errorInfo: ErrorInfo = {
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR_CODE'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('Unknown error occurred')).toBeInTheDocument();
    });

    it('should display error code badge', () => {
      const errorInfo: ErrorInfo = {
        message: 'テストエラー',
        code: 'TEST_ERROR'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('TEST_ERROR')).toBeInTheDocument();
      expect(screen.getByText('TEST_ERROR')).toHaveClass('bg-gray-200', 'px-2', 'py-0.5', 'rounded');
    });
  });

  describe('Field Information', () => {
    it('should display field information when provided', () => {
      const errorInfo: ErrorInfo = {
        message: 'バリデーションエラー',
        field: 'email'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('対象フィールド: email')).toBeInTheDocument();
    });
  });

  describe('Retry After Information', () => {
    it('should display retry after information', () => {
      const errorInfo: ErrorInfo = {
        message: 'レート制限エラー',
        retryAfter: 60
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      expect(screen.getByText('60秒後に再試行してください')).toBeInTheDocument();
    });
  });

  describe('Details Expansion', () => {
    it('should show details expansion button when details are provided', () => {
      const errorInfo: ErrorInfo = {
        message: 'エラーメッセージ',
        details: 'エラーの詳細情報\nスタックトレース等'
      };

      render(<ErrorDisplay error={errorInfo} showDetails={true} />);
      
      expect(screen.getByText('詳細を表示')).toBeInTheDocument();
    });

    it('should expand and collapse details on click', async () => {
      const user = userEvent.setup();
      const errorInfo: ErrorInfo = {
        message: 'エラーメッセージ',
        details: 'エラーの詳細情報'
      };

      render(<ErrorDisplay error={errorInfo} showDetails={true} />);
      
      const toggleButton = screen.getByText('詳細を表示');
      
      // Initially collapsed
      expect(screen.queryByText('エラーの詳細情報')).not.toBeInTheDocument();
      
      // Click to expand
      await user.click(toggleButton);
      expect(screen.getByText('詳細を非表示')).toBeInTheDocument();
      expect(screen.getByText('エラーの詳細情報')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(screen.getByText('詳細を非表示'));
      expect(screen.getByText('詳細を表示')).toBeInTheDocument();
      expect(screen.queryByText('エラーの詳細情報')).not.toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('should display formatted timestamp', () => {
      const errorInfo: ErrorInfo = {
        message: 'エラーメッセージ',
        timestamp: '2025-08-07T12:00:00.000Z'
      };

      render(<ErrorDisplay error={errorInfo} />);
      
      // Check if timestamp is displayed (exact format may vary by locale)
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should render retry button when showRetry is true', () => {
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          showRetry={true} 
          onRetry={mockOnRetry} 
        />
      );
      
      expect(screen.getByText('再試行')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          showRetry={true} 
          onRetry={mockOnRetry} 
        />
      );
      
      const retryButton = screen.getByText('再試行');
      await user.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during retry', async () => {
      const slowRetry = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const user = userEvent.setup();
      
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          showRetry={true} 
          onRetry={slowRetry} 
        />
      );
      
      const retryButton = screen.getByText('再試行');
      await user.click(retryButton);
      
      expect(screen.getByText('再試行中...')).toBeInTheDocument();
      expect(retryButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByText('再試行')).toBeInTheDocument();
      });
    });
  });

  describe('Dismiss Functionality', () => {
    it('should render dismiss button when onDismiss is provided', () => {
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          onDismiss={mockOnDismiss} 
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: 'エラーを閉じる' });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          onDismiss={mockOnDismiss} 
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: 'エラーを閉じる' });
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <ErrorDisplay 
          error="エラーメッセージ" 
          className="custom-error-class" 
        />
      );
      
      const container = screen.getByText('エラーメッセージ').closest('div');
      expect(container).toHaveClass('custom-error-class');
    });
  });
});

describe('ErrorBoundaryDisplay', () => {
  const mockResetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render error boundary display', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace...';
    
    render(<ErrorBoundaryDisplay error={error} resetError={mockResetError} />);
    
    expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
    expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
  });

  it('should call resetError when retry button is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Test error');
    
    render(<ErrorBoundaryDisplay error={error} resetError={mockResetError} />);
    
    const retryButton = screen.getByText('再試行');
    await user.click(retryButton);
    
    expect(mockResetError).toHaveBeenCalledTimes(1);
  });
});

describe('FormError', () => {
  it('should render form error', () => {
    render(<FormError error="フォームエラーです" field="email" />);
    
    expect(screen.getByText('フォームエラーです')).toBeInTheDocument();
    expect(screen.getByText('対象フィールド: email')).toBeInTheDocument();
  });

  it('should not render when error is null', () => {
    const { container } = render(<FormError error={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when error is empty string', () => {
    const { container } = render(<FormError error="" />);
    
    expect(container.firstChild).toBeNull();
  });
});

describe('ApiError', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render API error with object', () => {
    const apiError = {
      message: 'API エラーが発生しました',
      code: 'API_ERROR',
      details: 'API response details',
      field: 'request_body'
    };
    
    render(
      <ApiError 
        error={apiError} 
        onRetry={mockOnRetry} 
        onDismiss={mockOnDismiss} 
      />
    );
    
    expect(screen.getByText('API エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('API_ERROR')).toBeInTheDocument();
    expect(screen.getByText('対象フィールド: request_body')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('should render API error with string', () => {
    render(<ApiError error="Simple error message" />);
    
    expect(screen.getByText('Simple error message')).toBeInTheDocument();
  });

  it('should use fallback message for undefined error', () => {
    render(<ApiError error={undefined} />);
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });
});