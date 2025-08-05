'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface SimplePreset {
  id: number;
  preset_name: string;
  created_at: string;
}

interface SimpleProduct {
  id: number;
  name: string;
  price: number;
  category_id: number;
}

export default function SettingsPage() {
  const [presets, setPresets] = useState<SimplePreset[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // プリセット作成フォーム
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  
  // 商品作成フォーム
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category_id: '1'
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // プリセット取得
      const presetsResponse = await fetch('/api/admin/presets');
      if (presetsResponse.ok) {
        const presetsData = await presetsResponse.json();
        setPresets(presetsData.data || []);
      }

      // 商品取得
      const productsResponse = await fetch('/api/admin/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.data || []);
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPreset = async () => {
    if (!newPresetName.trim()) return;
    
    setIsCreatingPreset(true);
    try {
      const response = await fetch('/api/admin/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_name: newPresetName })
      });

      if (response.ok) {
        setNewPresetName('');
        loadData();
      }
    } catch (error) {
      console.error('プリセット作成エラー:', error);
    } finally {
      setIsCreatingPreset(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    
    setIsCreatingProduct(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseInt(newProduct.price),
          category_id: parseInt(newProduct.category_id),
          visible: true
        })
      });

      if (response.ok) {
        setNewProduct({ name: '', price: '', category_id: '1' });
        loadData();
      }
    } catch (error) {
      console.error('商品作成エラー:', error);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="フォーム管理" description="プリセットと商品を管理します">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="フォーム管理" description="プリセットと商品を管理します">
      <div className="space-y-8">
        {/* プリセット管理 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">プリセット管理</h3>
            
            {/* プリセット作成フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="プリセット名を入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={createPreset}
                  disabled={isCreatingPreset || !newPresetName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingPreset ? '作成中...' : '作成'}
                </button>
              </div>
            </div>

            {/* プリセット一覧 */}
            <div className="space-y-2">
              {presets.map((preset) => (
                <div key={preset.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                  <div>
                    <span className="font-medium">{preset.preset_name}</span>
                    <span className="ml-2 text-sm text-gray-500">ID: {preset.id}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(preset.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 商品管理 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">商品管理</h3>
            
            {/* 商品作成フォーム */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="商品名"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="価格"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">カテゴリ1</option>
                  <option value="2">カテゴリ2</option>
                </select>
                <button
                  onClick={createProduct}
                  disabled={isCreatingProduct || !newProduct.name.trim() || !newProduct.price}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isCreatingProduct ? '作成中...' : '商品作成'}
                </button>
              </div>
            </div>

            {/* 商品一覧 */}
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <span className="ml-2 text-sm text-gray-500">¥{product.price.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    カテゴリ: {product.category_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}