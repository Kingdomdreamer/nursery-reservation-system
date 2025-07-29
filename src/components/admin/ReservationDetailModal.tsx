'use client';

import { useState } from 'react';
import type { ReservationListItem } from '@/types';

interface ReservationDetailModalProps {
  reservation: ReservationListItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ReservationDetailModal({
  reservation,
  isOpen,
  onClose,
  onUpdate,
}: ReservationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    user_name: reservation.user_name,
    phone_number: reservation.phone_number,
    note: reservation.note || '',
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: API経由で予約更新を実装
      await new Promise(resolve => setTimeout(resolve, 1000)); // 一時的な遅延
      
      setIsEditing(false);
      onUpdate();
      alert('予約情報を更新しました（API実装予定）');
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('この予約をキャンセルしますか？')) return;

    setLoading(true);
    try {
      // TODO: API経由で予約キャンセルを実装
      await new Promise(resolve => setTimeout(resolve, 1000)); // 一時的な遅延

      onUpdate();
      onClose();
      alert('予約をキャンセルしました（API実装予定）');
    } catch (error) {
      console.error('キャンセルエラー:', error);
      alert('キャンセルに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            予約詳細 - {reservation.id.slice(0, 8)}...
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 顧客情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">顧客情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  顧客名
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.user_name}
                    onChange={(e) => setEditData({ ...editData, user_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{reservation.user_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone_number}
                    onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{reservation.phone_number}</p>
                )}
              </div>

              {reservation.furigana && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ふりがな
                  </label>
                  <p className="text-gray-900">{reservation.furigana}</p>
                </div>
              )}

              {reservation.address && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <p className="text-gray-900">
                    {reservation.zip && `〒${reservation.zip} `}
                    {reservation.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 予約情報 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">予約情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商品
                </label>
                <p className="text-gray-900">
                  {reservation.product?.join(', ') || '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量
                </label>
                <p className="text-gray-900">{reservation.quantity}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  単価
                </label>
                <p className="text-gray-900">¥{reservation.unit_price?.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  合計金額
                </label>
                <p className="text-lg font-bold text-blue-600">
                  ¥{reservation.total_amount?.toLocaleString()}
                </p>
              </div>

              {reservation.pickup_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    引き取り予定日
                  </label>
                  <p className="text-gray-900">{reservation.pickup_date}</p>
                </div>
              )}

              {reservation.variation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    バリエーション
                  </label>
                  <p className="text-gray-900">{reservation.variation}</p>
                </div>
              )}
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考
            </label>
            {isEditing ? (
              <textarea
                value={editData.note}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="備考を入力..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {reservation.note || '備考なし'}
              </p>
            )}
          </div>

          {/* システム情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">システム情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  予約ID
                </label>
                <p className="text-gray-900 font-mono">{reservation.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザーID
                </label>
                <p className="text-gray-900 font-mono">{reservation.user_id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  予約日時
                </label>
                <p className="text-gray-900">
                  {reservation.created_at 
                    ? new Date(reservation.created_at).toLocaleString('ja-JP')
                    : '-'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  更新日時
                </label>
                <p className="text-gray-900">
                  {reservation.updated_at 
                    ? new Date(reservation.updated_at).toLocaleString('ja-JP')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 mr-2"
            >
              キャンセル
            </button>
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  編集
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  閉じる
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}