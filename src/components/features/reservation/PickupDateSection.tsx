import React, { useMemo, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui';
import type { PickupWindow, Product } from '@/types';
import type { ReservationFormData } from '@/lib/validations/reservationSchema';

export interface PickupDateSectionProps {
  pickupWindows: PickupWindow[];
  selectedProducts: Product[];
  className?: string;
}

export const PickupDateSection = React.memo<PickupDateSectionProps>(({
  pickupWindows,
  selectedProducts,
  className,
}) => {
  const { control, watch, formState: { errors } } = useFormContext<ReservationFormData>();
  
  const selectedPickupDate = watch('pickup_date');

  // Filter available pickup dates based on selected products
  const availablePickupWindows = useMemo(() => {
    if (selectedProducts.length === 0) {
      return pickupWindows;
    }

    const selectedProductIds = selectedProducts.map(p => p.product_id);
    return pickupWindows.filter(window => 
      selectedProductIds.includes(window.product_id)
    );
  }, [pickupWindows, selectedProducts]);

  // Group pickup windows by date
  const groupedPickupWindows = useMemo(() => {
    const groups: Record<string, PickupWindow[]> = {};
    
    availablePickupWindows.forEach(window => {
      const dateKey = window.pickup_date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(window);
    });

    return groups;
  }, [availablePickupWindows]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedPickupWindows).sort();
  }, [groupedPickupWindows]);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日（${weekday}）`;
  }, []);

  const formatTimeSlot = useCallback((startTime: string, endTime: string): string => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${parseInt(hours)}:${minutes}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }, []);

  const getAvailableSlots = useCallback((date: string): number => {
    const windows = groupedPickupWindows[date] || [];
    return windows.reduce((total, window) => total + (window.available_slots || 0), 0);
  }, [groupedPickupWindows]);

  const isDateAvailable = useCallback((date: string): boolean => {
    return getAvailableSlots(date) > 0;
  }, [getAvailableSlots]);

  if (selectedProducts.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          引き取り日時
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            先に商品を選択してください。選択した商品に応じて利用可能な引き取り日時が表示されます。
          </p>
        </div>
      </div>
    );
  }

  if (sortedDates.length === 0) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          引き取り日時
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            選択した商品の引き取り可能日時がありません。商品選択を見直してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
        引き取り日時
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        ご希望の引き取り日時を選択してください
      </p>

      <Controller
        name="pickup_date"
        control={control}
        render={({ field }) => (
          <div className="space-y-3">
            {sortedDates.map((date) => {
              const windows = groupedPickupWindows[date];
              const availableSlots = getAvailableSlots(date);
              const isAvailable = isDateAvailable(date);
              const isSelected = field.value === date;

              return (
                <div
                  key={date}
                  className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                    !isAvailable
                      ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-green-50 border-green-500 ring-2 ring-green-200'
                        : 'bg-white border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                  onClick={() => {
                    if (isAvailable) {
                      field.onChange(date);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {
                            if (isAvailable) {
                              field.onChange(date);
                            }
                          }}
                          disabled={!isAvailable}
                          className="text-green-600 focus:ring-green-500 disabled:opacity-50"
                        />
                        <h3 className="font-medium text-gray-900">
                          {formatDate(date)}
                        </h3>
                      </div>

                      {/* Time slots */}
                      <div className="ml-6 mt-2 space-y-1">
                        {windows.map((window) => (
                          <div
                            key={window.id}
                            className="text-sm text-gray-600 flex items-center justify-between"
                          >
                            <span>
                              {formatTimeSlot(window.start_time, window.end_time)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              (window.available_slots || 0) > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              残り{window.available_slots || 0}枠
                            </span>
                          </div>
                        ))}
                      </div>

                      {!isAvailable && (
                        <p className="ml-6 mt-2 text-xs text-red-500">
                          この日は満席です
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        availableSlots > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        計{availableSlots}枠
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      />

      {/* Error Message */}
      {errors.pickup_date && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{errors.pickup_date.message}</p>
        </div>
      )}

      {/* Selected Date Summary */}
      {selectedPickupDate && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 text-sm mb-2">選択した引き取り日時</h4>
          <p className="text-sm text-gray-700">
            {formatDate(selectedPickupDate)}
          </p>
          <div className="mt-2 space-y-1">
            {groupedPickupWindows[selectedPickupDate]?.map((window) => (
              <p key={window.id} className="text-xs text-gray-600">
                {formatTimeSlot(window.start_time, window.end_time)} 
                （残り {window.available_slots || 0} 枠）
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• 引き取り可能日時は選択した商品によって決まります</p>
        <p>• 各時間帯には定員があります。満席の場合は選択できません</p>
        <p>• 引き取り時間に遅れる場合は事前にご連絡ください</p>
      </div>
    </div>
  );
});

PickupDateSection.displayName = 'PickupDateSection';