/**
 * 予約コンポーネント - ビジネスロジック統合
 * 予約関連の機能を統一したコンポーネント
 */

import React from 'react';
import { BaseComponent, BaseComponentProps } from '@/components/base/BaseComponent';
import type { Reservation, ReservationStatus } from '@/types/database';

/**
 * 予約コンポーネントのプロパティ
 */
export interface ReservationComponentProps extends BaseComponentProps {
  reservation: Reservation;
  variant?: 'card' | 'list' | 'detail';
  showActions?: boolean;
  onView?: (reservation: Reservation) => void;
  onEdit?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  onDelete?: (reservation: Reservation) => void;
}

/**
 * 予約コンポーネント
 */
export class ReservationComponent extends BaseComponent<ReservationComponentProps> {
  protected componentName = 'ReservationComponent';

  /**
   * ステータスの表示スタイル
   */
  private getStatusStyle(status: ReservationStatus): string {
    const styles: Record<ReservationStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * ステータスの日本語表示
   */
  private getStatusLabel(status: ReservationStatus): string {
    const labels: Record<ReservationStatus, string> = {
      pending: '未確認',
      confirmed: '確認済み',
      cancelled: 'キャンセル',
      completed: '完了'
    };
    return labels[status] || status;
  }

  /**
   * 予約表示処理
   */
  private handleView = () => {
    const { reservation, onView } = this.props;
    if (onView) {
      onView(reservation);
    }
  };

  /**
   * 予約編集処理
   */
  private handleEdit = () => {
    const { reservation, onEdit } = this.props;
    if (onEdit) {
      onEdit(reservation);
    }
  };

  /**
   * 予約キャンセル処理
   */
  private handleCancel = () => {
    const { reservation, onCancel } = this.props;
    if (onCancel && window.confirm('この予約をキャンセルしますか？')) {
      onCancel(reservation);
    }
  };

  /**
   * 予約削除処理
   */
  private handleDelete = () => {
    const { reservation, onDelete } = this.props;
    if (onDelete && window.confirm('この予約を削除しますか？削除後は復元できません。')) {
      onDelete(reservation);
    }
  };

  /**
   * カード形式の描画
   */
  private renderCard(): React.ReactNode {
    const { reservation, showActions = true } = this.props;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {reservation.user_name}
            </h3>
            <p className="text-sm text-gray-600">
              予約番号: {reservation.reservation_number}
            </p>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${this.getStatusStyle(reservation.status)}
          `}>
            {this.getStatusLabel(reservation.status)}
          </span>
        </div>

        {/* 予約詳細 */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">引き取り日:</span>
            <span className="text-gray-900">
              {new Date(reservation.pickup_date).toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          {reservation.pickup_time && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">引き取り時間:</span>
              <span className="text-gray-900">{reservation.pickup_time}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">合計金額:</span>
            <span className="text-gray-900 font-semibold">
              ¥{reservation.total_amount.toLocaleString()}
            </span>
          </div>
          
          {reservation.phone_number && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">電話番号:</span>
              <span className="text-gray-900">{reservation.phone_number}</span>
            </div>
          )}
        </div>

        {/* 商品リスト */}
        {reservation.selected_products && reservation.selected_products.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">注文商品</h4>
            <div className="space-y-1">
              {reservation.selected_products.map((product, index) => (
                <div key={index} className="flex justify-between text-sm text-gray-600">
                  <span>{product.name}</span>
                  <span>{product.quantity}個</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アクション */}
        {showActions && (
          <div className="flex space-x-2 pt-3 border-t">
            <button
              onClick={this.handleView}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              詳細
            </button>
            
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <>
                <button
                  onClick={this.handleEdit}
                  className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={this.handleCancel}
                  className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  /**
   * リスト形式の描画
   */
  private renderList(): React.ReactNode {
    const { reservation, showActions = true } = this.props;

    return (
      <div className="flex items-center p-4 border-b hover:bg-gray-50 transition-colors">
        {/* 基本情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">
                {reservation.user_name}
              </h3>
              <p className="text-sm text-gray-600 truncate">
                {reservation.reservation_number}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-900">
                {new Date(reservation.pickup_date).toLocaleDateString('ja-JP')}
              </p>
              {reservation.pickup_time && (
                <p className="text-xs text-gray-500">{reservation.pickup_time}</p>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                ¥{reservation.total_amount.toLocaleString()}
              </p>
              <span className={`
                inline-block px-2 py-1 rounded-full text-xs font-medium
                ${this.getStatusStyle(reservation.status)}
              `}>
                {this.getStatusLabel(reservation.status)}
              </span>
            </div>
          </div>
        </div>

        {/* アクション */}
        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={this.handleView}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="詳細表示"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
            </button>
            
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <>
                <button
                  onClick={this.handleEdit}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                </button>
                <button
                  onClick={this.handleCancel}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="キャンセル"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  /**
   * 詳細形式の描画
   */
  private renderDetail(): React.ReactNode {
    const { reservation } = this.props;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 基本情報 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">予約詳細</h2>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">予約番号</dt>
                  <dd className="text-lg font-mono text-gray-900">{reservation.reservation_number}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">お名前</dt>
                  <dd className="text-lg text-gray-900">{reservation.user_name}</dd>
                </div>
                
                {reservation.furigana && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ふりがな</dt>
                    <dd className="text-lg text-gray-900">{reservation.furigana}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="text-lg text-gray-900">{reservation.phone_number}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd>
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${this.getStatusStyle(reservation.status)}
                    `}>
                      {this.getStatusLabel(reservation.status)}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* 引き取り情報 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">引き取り情報</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">引き取り日</dt>
                  <dd className="text-lg text-gray-900">
                    {new Date(reservation.pickup_date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </dd>
                </div>
                
                {reservation.pickup_time && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">引き取り時間</dt>
                    <dd className="text-lg text-gray-900">{reservation.pickup_time}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 備考 */}
            {reservation.note && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">備考</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{reservation.note}</p>
              </div>
            )}
          </div>

          {/* 右側: 注文内容 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">注文内容</h3>
              
              {reservation.selected_products && reservation.selected_products.length > 0 ? (
                <div className="space-y-3">
                  {reservation.selected_products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        {product.variation_name && (
                          <p className="text-sm text-gray-600">{product.variation_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ¥{(product.price * product.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          ¥{product.price.toLocaleString()} × {product.quantity}個
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">合計金額</span>
                      <span className="text-xl font-bold text-gray-900">
                        ¥{reservation.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">注文商品がありません</p>
              )}
            </div>

            {/* タイムスタンプ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">履歴</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">作成日時:</dt>
                  <dd className="text-gray-900">
                    {new Date(reservation.created_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
                {reservation.updated_at !== reservation.created_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">最終更新:</dt>
                    <dd className="text-gray-900">
                      {new Date(reservation.updated_at).toLocaleString('ja-JP')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * コンテンツの描画
   */
  protected renderContent(): React.ReactNode {
    const { variant = 'card' } = this.props;

    switch (variant) {
      case 'list':
        return this.renderList();
      case 'detail':
        return this.renderDetail();
      case 'card':
      default:
        return this.renderCard();
    }
  }
}

/**
 * 関数コンポーネント版
 */
export const ReservationCard: React.FC<ReservationComponentProps> = (props) => {
  return React.createElement(ReservationComponent, props);
};