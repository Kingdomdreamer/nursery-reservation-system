/**
 * ErrorBoundary コンポーネントのテスト
 * React エラーバウンダリの動作確認
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorBoundary,
  withErrorBoundary,
  useAsyncError,
  PageErrorBoundary,
  FormErrorBoundary
} from '@/components/error/ErrorBoundary';

// テスト用のコンポーネント
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return <div>No error</div>;
};

const AsyncErrorComponent = () => {
  const throwAsyncError = useAsyncError();
  
  return (
    <button 
      onClick={() => throwAsyncError(new Error('Async error'))}
    >
      Throw Async Error
    </button>
  );
};

// Console error/warn のモック
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('再試行')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should call custom onError handler', () => {
      const mockOnError = jest.fn();
      
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should use custom fallback component', () => {
      const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <h1>Custom Error Display</h1>
          <p>{error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      );
      
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error Display')).toBeInTheDocument();
      expect(screen.getByText('Test error from component')).toBeInTheDocument();
    });
  });

  describe('Error Reset', () => {
    it('should reset error state when resetError is called', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      // Error is shown
      expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
      
      // Click retry button
      const retryButton = screen.getByText('再試行');
      await user.click(retryButton);
      
      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Production Environment', () => {
    it('should call logErrorToService in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(logSpy).toHaveBeenCalledWith(
        'Error report:',
        expect.objectContaining({
          message: 'Test error from component',
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      );
      
      logSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);
    
    render(<WrappedComponent shouldThrow={false} />);
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
  });

  it('should use custom fallback component', () => {
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom fallback: {error.message}</div>
    );
    
    const WrappedComponent = withErrorBoundary(ThrowError, CustomFallback);
    
    render(<WrappedComponent shouldThrow={true} />);
    
    expect(screen.getByText('Custom fallback: Test error from component')).toBeInTheDocument();
  });

  it('should set correct displayName', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';
    
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should use component name when displayName is not available', () => {
    const TestComponent = () => <div>Test</div>;
    
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});

describe('useAsyncError', () => {
  it('should throw async error', async () => {
    const user = userEvent.setup();
    
    // Wrap in ErrorBoundary to catch the error
    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );
    
    const button = screen.getByText('Throw Async Error');
    await user.click(button);
    
    // The error should be caught by ErrorBoundary
    expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
  });

  it('should log async error to console', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );
    
    const button = screen.getByText('Throw Async Error');
    await user.click(button);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Async error:',
      expect.any(Error)
    );
  });
});

describe('PageErrorBoundary', () => {
  it('should render with page name in error log', () => {
    render(
      <PageErrorBoundary pageName="TestPage">
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );
    
    expect(screen.getByText('アプリケーションでエラーが発生しました')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Page error in TestPage:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should use "unknown page" when pageName is not provided', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Page error in unknown page:',
      expect.any(Error),
      expect.any(Object)
    );
  });
});

describe('FormErrorBoundary', () => {
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render custom form error fallback', () => {
    render(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );
    
    expect(screen.getByText('フォームエラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('フォームの処理中にエラーが発生しました。ページを再読み込みして再度お試しください。')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
    expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
  });

  it('should call custom onError handler', () => {
    render(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );
    
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reset error when retry button is clicked', async () => {
    const user = userEvent.setup();
    
    const { rerender } = render(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );
    
    const retryButton = screen.getByText('再試行');
    await user.click(retryButton);
    
    // Re-render with no error
    rerender(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={false} />
      </FormErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', async () => {
    const user = userEvent.setup();
    const mockReload = jest.fn();
    
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });
    
    render(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );
    
    const reloadButton = screen.getByText('ページを再読み込み');
    await user.click(reloadButton);
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('should log form-specific error', () => {
    render(
      <FormErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Form error:',
      expect.any(Error),
      expect.any(Object)
    );
  });
});