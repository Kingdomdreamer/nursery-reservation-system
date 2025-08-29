'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface SimpleProduct {
  id: number;
  name: string;
  price: number;
  visible: boolean;
}

export const SimpleProductManager: React.FC = () => {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  // ローカルストレージから商品データを読み込み
  useEffect(() => {
    const savedProducts = localStorage.getItem('simple-products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // デフォルト商品
      const defaultProducts = [
        { id: 1, name: 'りんご', price: 100, visible: true },
        { id: 2, name: 'みかん', price: 120, visible: true },
        { id: 3, name: 'バナナ', price: 80, visible: true }
      ];
      setProducts(defaultProducts);
      localStorage.setItem('simple-products', JSON.stringify(defaultProducts));
    }
  }, []);

  // ローカルストレージに保存
  const saveProducts = (updatedProducts: SimpleProduct[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('simple-products', JSON.stringify(updatedProducts));
  };

  // 商品追加
  const addProduct = () => {
    if (!newProduct.name.trim() || newProduct.price <= 0) {
      alert('商品名と価格を正しく入力してください');
      return;
    }

    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const product: SimpleProduct = {
      id: newId,
      name: newProduct.name.trim(),
      price: newProduct.price,
      visible: true
    };

    saveProducts([...products, product]);
    setNewProduct({ name: '', price: 0 });
  };

  // 商品編集
  const updateProduct = (id: number, updates: Partial<SimpleProduct>) => {
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    saveProducts(updatedProducts);
    setEditingId(null);
  };

  // 商品削除
  const deleteProduct = (id: number) => {
    if (confirm('この商品を削除しますか？')) {
      const updatedProducts = products.filter(p => p.id !== id);
      saveProducts(updatedProducts);
    }
  };

  // 表示/非表示切り替え
  const toggleVisibility = (id: number) => {
    updateProduct(id, { visible: !products.find(p => p.id === id)?.visible });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">商品管理（簡易版）</h2>
        
        {/* 商品追加フォーム */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-3">新しい商品を追加</h3>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品名
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="商品名を入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格（円）
              </label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <Button onClick={addProduct} className="px-6">
              追加
            </Button>
          </div>
        </div>

        {/* 商品一覧 */}
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-900">商品一覧</h3>
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-8">商品がありません</p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">#{product.id}</span>
                    {editingId === product.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          defaultValue={product.name}
                          onBlur={(e) => updateProduct(product.id, { name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <input
                          type="number"
                          defaultValue={product.price}
                          onBlur={(e) => updateProduct(product.id, { price: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <span className={`font-medium ${product.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                          {product.name}
                        </span>
                        <span className={`text-sm ${product.visible ? 'text-gray-600' : 'text-gray-400'}`}>
                          ¥{product.price.toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.visible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.visible ? '表示中' : '非表示'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingId(editingId === product.id ? null : product.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {editingId === product.id ? '完了' : '編集'}
                    </button>
                    <button
                      onClick={() => toggleVisibility(product.id)}
                      className={`text-sm ${
                        product.visible 
                          ? 'text-yellow-600 hover:text-yellow-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {product.visible ? '非表示' : '表示'}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用方法の説明 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">📝 使用方法</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 商品名と価格を入力して「追加」ボタンで新しい商品を追加</li>
            <li>• 「編集」ボタンで商品名と価格を変更可能</li>
            <li>• 「非表示」にした商品は予約フォームに表示されません</li>
            <li>• データはブラウザに保存されます（他の管理者とは共有されません）</li>
          </ul>
        </div>
      </div>
    </div>
  );
};