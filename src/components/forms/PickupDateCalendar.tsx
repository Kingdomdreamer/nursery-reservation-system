'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { format, isValid, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { PickupWindow, Product } from '@/types';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

interface PickupDateCalendarProps {
  products: Product[];
  pickupWindows: PickupWindow[];
}

export const PickupDateCalendar: React.FC<PickupDateCalendarProps> = ({
  products,
  pickupWindows,
}) => {
  const { setValue, watch, formState: { errors } } = useFormContext<ReservationFormData>();
  
  const selectedProducts = watch('products') || [];
  const selectedPickupDates = watch('pickup_dates') || {};

  const [availableDates, setAvailableDates] = useState<{ [key: string]: string[] }>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Calculate available dates based on selected products
    const datesByCategory: { [key: string]: string[] } = {};

    selectedProducts.forEach(product => {
      const productData = products.find(p => p.id === product.product_id);
      const category = productData?.category_id?.toString() || 'default';

      // Find pickup windows for this product
      const productWindows = pickupWindows.filter(window => 
        window.product_id === product.product_id
      );

      productWindows.forEach(window => {
        if (window.dates && window.dates.length > 0) {
          if (!datesByCategory[category]) {
            datesByCategory[category] = [];
          }
          
          // Add dates that are not already included
          window.dates.forEach(date => {
            if (!datesByCategory[category].includes(date)) {
              datesByCategory[category].push(date);
            }
          });
        }
      });
    });

    // Sort dates for each category
    Object.keys(datesByCategory).forEach(category => {
      datesByCategory[category].sort();
    });

    setAvailableDates(datesByCategory);
  }, [selectedProducts, products, pickupWindows]);

  const handleDateSelect = (category: string, date: string) => {
    const newPickupDates = { ...selectedPickupDates };
    newPickupDates[category] = date;
    setValue('pickup_dates', newPickupDates);
  };

  const getCategoryName = (categoryId: string): string => {
    switch (categoryId) {
      case '1': return '野菜セット';
      case '2': return '果物セット';
      case '3': return 'お米セット';
      default: return 'その他';
    }
  };

  const formatDateDisplay = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      
      return format(date, 'M月d日(E)', { locale: ja });
    } catch {
      return dateString;
    }
  };

  const isDateInPast = (dateString: string): boolean => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return date < today;
    } catch {
      return true;
    }
  };

  // Generate calendar grid for the current month
  const generateCalendarDays = () => {
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const end = endOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    
    return eachDayOfInterval({ start, end });
  };

  const getDateAvailability = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const availability: { [key: string]: boolean } = {};
    
    Object.entries(availableDates).forEach(([category, dates]) => {
      availability[category] = dates.includes(dateString);
    });
    
    return availability;
  };

  const calendarDays = generateCalendarDays();

  if (selectedProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-900">引き取り日選択</h2>
        </div>
        <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
          商品を選択すると、引き取り可能日が表示されます
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-900">引き取り日選択</h2>
        <p className="text-sm text-gray-600">
          選択した商品カテゴリごとに引き取り日を選択してください
        </p>
      </div>

      {/* Category-based date selection */}
      <div className="space-y-6">
        {Object.entries(availableDates).map(([category, dates]) => {
          const selectedDate = selectedPickupDates[category];
          
          return (
            <div key={category} className="space-y-3">
              <h3 className="text-md font-medium text-gray-800 border-l-4 border-blue-500 pl-3">
                {getCategoryName(category)} の引き取り日
              </h3>
              
              {dates.length === 0 ? (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  この商品カテゴリの引き取り可能日が設定されていません
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {dates.map((date) => {
                    const isPast = isDateInPast(date);
                    const isSelected = selectedDate === date;
                    
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => !isPast && handleDateSelect(category, date)}
                        disabled={isPast}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isPast
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-medium">
                          {formatDateDisplay(date)}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          10:00〜18:00
                        </div>
                        {isPast && (
                          <div className="text-xs text-red-500 mt-1">
                            選択不可
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar view (optional visual aid) */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 rounded hover:bg-gray-200"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 rounded hover:bg-gray-200"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '月', '火', '水', '木', '金', '土'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const availability = getDateAvailability(day);
            const hasAvailability = Object.values(availability).some(Boolean);
            
            return (
              <div
                key={index}
                className={`relative p-2 text-center text-sm ${
                  !isCurrentMonth
                    ? 'text-gray-300'
                    : hasAvailability
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600'
                }`}
              >
                {day.getDate()}
                {hasAvailability && isCurrentMonth && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>引き取り可能日</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected dates summary */}
      {Object.keys(selectedPickupDates).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">選択された引き取り日</h3>
          <div className="space-y-2">
            {Object.entries(selectedPickupDates).map(([category, date]) => (
              <div key={category} className="flex justify-between items-center text-sm">
                <span className="font-medium">
                  {getCategoryName(category)}
                </span>
                <span className="text-blue-700">
                  {formatDateDisplay(date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.pickup_dates && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            {typeof errors.pickup_dates?.message === 'string' 
              ? errors.pickup_dates.message 
              : '引き取り日時を選択してください'}
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• 商品カテゴリごとに引き取り日を選択する必要があります</p>
        <p>• 過去の日付は選択できません</p>
        <p>• 引き取り時間は10:00〜18:00です</p>
      </div>
    </div>
  );
};