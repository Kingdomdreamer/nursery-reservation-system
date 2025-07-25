import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-4',
      },
      color: {
        primary: 'border-green-600',
        secondary: 'border-gray-600',
        white: 'border-white',
        current: 'border-current',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);

export interface LoadingSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, color, label = 'Loading...', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        <div
          className={cn(spinnerVariants({ size, color }))}
          role="status"
          aria-label={label}
        >
          <span className="sr-only">{label}</span>
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// フルスクリーンローディング用のコンポーネント
export interface FullScreenLoadingProps {
  message?: string;
  description?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  message = '読み込み中...',
  description,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">{message}</p>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    </div>
  );
};

export { LoadingSpinner, spinnerVariants };