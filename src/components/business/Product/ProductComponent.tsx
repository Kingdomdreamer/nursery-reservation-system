/**
 * 商品コンポーネント - ビジネスロジック統合
 * 商品関連の機能を統一したコンポーネント
 */

import React from 'react';
import { BaseComponent, BaseComponentProps } from '@/components/base/BaseComponent';
import type { Product } from '@/types/index';

/**
 * 商品コンポーネントのプロパティ
 */
export interface ProductComponentProps extends BaseComponentProps {
  product: Product;
  variant?: 'card' | 'list' | 'detail';
  showPrice?: boolean;
  showStock?: boolean;
  isSelected?: boolean;
  quantity?: number;
  maxQuantity?: number;
  onSelect?: (product: Product) => void;
  onQuantityChange?: (product: Product, quantity: number) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

/**
 * 商品カードコンポーネント
 */
export class ProductComponent extends BaseComponent<ProductComponentProps> {
  protected componentName = 'ProductComponent';

  /**
   * 商品選択処理
   */
  private handleSelect = () => {
    const { product, onSelect } = this.props;
    if (onSelect) {
      onSelect(product);
    }
  };

  /**
   * 数量変更処理
   */
  private handleQuantityChange = (newQuantity: number) => {
    const { product, onQuantityChange, maxQuantity = 99 } = this.props;
    
    if (newQuantity < 0 || newQuantity > maxQuantity) {
      return;
    }

    if (onQuantityChange) {
      onQuantityChange(product, newQuantity);
    }
  };

  /**
   * 編集処理
   */
  private handleEdit = () => {
    const { product, onEdit } = this.props;
    if (onEdit) {
      onEdit(product);
    }
  };

  /**
   * 削除処理
   */
  private handleDelete = () => {
    const { product, onDelete } = this.props;
    if (onDelete && window.confirm('この商品を削除しますか？')) {
      onDelete(product);
    }
  };

  /**
   * カード形式の描画
   */
  private renderCard(): React.ReactNode {
    const { 
      product, 
      showPrice = true, 
      showStock = false, 
      isSelected = false, 
      quantity = 0 
    } = this.props;

    return (
      <div 
        className={`
          border rounded-lg p-4 transition-all cursor-pointer
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${!product.visible ? 'opacity-50' : ''}
        `}
        onClick={this.handleSelect}
      >
        {/* 商品画像 */}
        {product.image_url && (
          <div className="aspect-square mb-3 bg-gray-100 rounded-md overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* 商品情報 */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          
          {product.variation_name && (
            <p className="text-sm text-gray-600">
              {product.variation_name}
            </p>
          )}

          {showPrice && (
            <p className="text-lg font-semibold text-gray-900">
              ¥{product.price.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({product.tax_type})
              </span>
            </p>
          )}

          {showStock && product.stock_quantity !== undefined && (
            <p className="text-sm text-gray-600">
              在庫: {product.stock_quantity}個
            </p>
          )}

          {/* ステータス表示 */}
          <div className="flex items-center gap-2">
            <span className={`
              text-xs px-2 py-1 rounded
              ${product.visible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              {product.visible ? '表示中' : '非表示'}
            </span>
            
            {product.product_code && (
              <span className="text-xs text-gray-500">
                {product.product_code}
              </span>
            )}
          </div>

          {/* 数量選択 */}
          {quantity > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-600">数量:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleQuantityChange(quantity - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleQuantityChange(quantity + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * リスト形式の描画
   */
  private renderList(): React.ReactNode {
    const { 
      product, 
      showPrice = true, 
      isSelected = false,
      onEdit,
      onDelete
    } = this.props;

    return (
      <div 
        className={`
          flex items-center p-4 border-b transition-colors
          ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
          ${!product.visible ? 'opacity-50' : ''}
        `}
        onClick={this.handleSelect}
      >
        {/* 商品画像 */}
        {product.image_url && (
          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* 商品情報 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {product.name}
          </h3>
          
          {product.variation_name && (
            <p className="text-sm text-gray-600 truncate">
              {product.variation_name}
            </p>
          )}

          <div className="flex items-center gap-4 mt-1">
            {showPrice && (
              <span className="text-sm font-semibold text-gray-900">
                ¥{product.price.toLocaleString()}
              </span>
            )}
            
            <span className={`
              text-xs px-2 py-1 rounded
              ${product.visible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              {product.visible ? '表示中' : '非表示'}
            </span>
            
            {product.product_code && (
              <span className="text-xs text-gray-500">
                {product.product_code}
              </span>
            )}
          </div>
        </div>

        {/* アクション */}
        {(onEdit || onDelete) && (
          <div className="flex items-center space-x-2 ml-4">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  this.handleEdit();
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="編集"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  this.handleDelete();
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="削除"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd"/>
                </svg>
              </button>
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
    const { product, showPrice = true, showStock = true } = this.props;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 商品画像 */}
          {product.image_url && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 商品詳細 */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product.name}
              </h1>
              {product.variation_name && (
                <p className="text-lg text-gray-600 mt-1">
                  {product.variation_name}
                </p>
              )}
            </div>

            {showPrice && (
              <div className="text-3xl font-bold text-gray-900">
                ¥{product.price.toLocaleString()}
                <span className="text-base font-normal text-gray-500 ml-2">
                  ({product.tax_type})
                </span>
              </div>
            )}

            {product.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">商品説明</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ステータス:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  product.visible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.visible ? '表示中' : '非表示'}
                </span>
              </div>
              
              {product.product_code && (
                <div>
                  <span className="text-gray-500">商品コード:</span>
                  <span className="ml-2 font-mono">{product.product_code}</span>
                </div>
              )}
              
              {showStock && product.stock_quantity !== undefined && (
                <div>
                  <span className="text-gray-500">在庫:</span>
                  <span className="ml-2">{product.stock_quantity}個</span>
                </div>
              )}
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
export const ProductCard: React.FC<ProductComponentProps> = (props) => {
  return React.createElement(ProductComponent, props);
};