/**
 * 数量管理コントロールコンポーネント
 */
import React from 'react';
import { Button } from '@/components/ui';
import { safeQuantity } from '@/lib/utils/safeRendering';

interface QuantityControlsProps {
  value: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export const QuantityControls: React.FC<QuantityControlsProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  size = 'md',
  showLabel = false,
  label = '数量'
}) => {
  const safeValue = safeQuantity(value);
  
  const handleIncrement = () => {
    const newValue = Math.min(safeValue + step, max);
    if (newValue !== safeValue) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(safeValue - step, min);
    if (newValue !== safeValue) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value, 10);
    if (!isNaN(inputValue)) {
      const clampedValue = Math.max(min, Math.min(max, inputValue));
      onChange(clampedValue);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'w-6 h-6 text-xs',
          input: 'w-12 text-sm py-0.5 px-1',
          gap: 'space-x-2'
        };
      case 'lg':
        return {
          button: 'w-10 h-10 text-base',
          input: 'w-20 text-lg py-2 px-3',
          gap: 'space-x-4'
        };
      default: // md
        return {
          button: 'w-8 h-8 text-sm',
          input: 'w-16 text-center py-1 px-2',
          gap: 'space-x-3'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const canDecrement = safeValue > min && !disabled;
  const canIncrement = safeValue < max && !disabled;

  return (
    <div className="flex flex-col space-y-2">
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className={`flex items-center ${sizeClasses.gap}`}>
        <Button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          variant="outline"
          size="sm"
          className={`${sizeClasses.button} p-0 flex items-center justify-center`}
          aria-label="数量を減らす"
        >
          -
        </Button>
        
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={`${sizeClasses.input} text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500`}
          aria-label={`${label} (${min}から${max}まで)`}
        />
        
        <Button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          variant="outline"
          size="sm"
          className={`${sizeClasses.button} p-0 flex items-center justify-center`}
          aria-label="数量を増やす"
        >
          +
        </Button>
      </div>
      
      {(safeValue === min || safeValue === max) && (
        <div className="text-xs text-gray-500 text-center">
          {safeValue === min && min > 0 && `最小: ${min}`}
          {safeValue === max && max < 999 && `最大: ${max}`}
        </div>
      )}
    </div>
  );
};