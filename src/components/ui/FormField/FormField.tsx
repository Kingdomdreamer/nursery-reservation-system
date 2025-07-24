import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    label,
    htmlFor,
    required = false,
    optional = false,
    error,
    hint,
    children,
    className,
    labelClassName,
    errorClassName,
    hintClassName,
  }, ref) => {
    const fieldId = htmlFor || React.useId();

    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-red-500" aria-label="必須">
                *
              </span>
            )}
            {optional && (
              <span className="ml-1 text-gray-400 text-xs font-normal">
                （任意）
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                ...child.props,
                id: child.props.id || fieldId,
                'aria-invalid': error ? 'true' : undefined,
                'aria-describedby': [
                  error ? `${fieldId}-error` : '',
                  hint ? `${fieldId}-hint` : '',
                ].filter(Boolean).join(' ') || undefined,
              });
            }
            return child;
          })}
        </div>

        {hint && !error && (
          <p
            id={`${fieldId}-hint`}
            className={cn(
              'text-xs text-gray-600',
              hintClassName
            )}
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={`${fieldId}-error`}
            className={cn(
              'text-xs text-red-600 flex items-center',
              errorClassName
            )}
            role="alert"
          >
            <svg
              className="mr-1 h-3 w-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };