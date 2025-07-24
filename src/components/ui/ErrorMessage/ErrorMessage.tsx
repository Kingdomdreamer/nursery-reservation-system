import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { Button } from '../Button';

const errorVariants = cva(
  'rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'border-red-200 bg-red-50 text-red-800',
        destructive: 'border-red-500 bg-red-600 text-white',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      },
      size: {
        sm: 'p-3 text-sm',
        md: 'p-4 text-sm',
        lg: 'p-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof errorVariants> {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  showIcon?: boolean;
}

const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    message, 
    action, 
    onClose,
    showIcon = true,
    ...props 
  }, ref) => {
    const iconColor = variant === 'destructive' ? 'text-white' : 
                     variant === 'warning' ? 'text-yellow-600' : 'text-red-600';

    return (
      <div
        ref={ref}
        className={cn(errorVariants({ variant, size }), className)}
        role="alert"
        {...props}
      >
        <div className="flex items-start">
          {showIcon && (
            <div className="flex-shrink-0">
              <svg
                className={cn('h-5 w-5', iconColor)}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          
          <div className={cn('flex-1', showIcon && 'ml-3')}>
            {title && (
              <h3 className="text-sm font-medium mb-1">
                {title}
              </h3>
            )}
            <p className={cn('text-sm', !title && 'font-medium')}>
              {message}
            </p>
            
            {action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant={variant === 'destructive' ? 'outline' : 'primary'}
                  onClick={action.onClick}
                  className={variant === 'destructive' ? 'border-white text-white hover:bg-white hover:text-red-600' : ''}
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>
          
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  variant === 'destructive' 
                    ? 'text-white hover:bg-white focus:ring-white' 
                    : variant === 'warning'
                      ? 'text-yellow-600 hover:bg-yellow-600 focus:ring-yellow-600'
                      : 'text-red-600 hover:bg-red-600 focus:ring-red-600'
                )}
                aria-label="閉じる"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';

// フルスクリーンエラー用のコンポーネント
export interface FullScreenErrorProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const FullScreenError: React.FC<FullScreenErrorProps> = ({
  title = 'エラーが発生しました',
  message,
  action,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
        </div>
        
        {action && (
          <div className="text-center">
            <Button onClick={action.onClick} className="w-full">
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export { ErrorMessage, errorVariants };