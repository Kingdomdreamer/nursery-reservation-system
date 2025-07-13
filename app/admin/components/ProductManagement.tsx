'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  price: number
  category: 'fertilizer' | 'pesticide' | 'seedling' | 'tool'
  stock: number
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const categoryLabels = {
  fertilizer: '肥料',
  pesticide: '農薬',
  seedling: '苗',
  tool: '農具'
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'fertilizer' as Product['category'],
    stock: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    // 実際の実装ではAPIから商品データを取得
    const mockData: Product[] = [
      {
        id: 'PROD001',
        name: '有機肥料A',
        price: 1500,
        category: 'fertilizer',
        stock: 25,
        description: '有機栽培に最適な肥料です',
        isActive: true,
        createdAt: '2024-01-01T10:00:00',
        updatedAt: '2024-01-15T14:30:00'
      },
      {
        id: 'PROD002',
        name: '除草剤B',
        price: 2800,
        category: 'pesticide',
        stock: 15,
        description: '効果的な除草剤',
        isActive: true,
        createdAt: '2024-01-02T11:00:00',
        updatedAt: '2024-01-10T09:15:00'
      },
      {
        id: 'PROD003',
        name: 'トマト苗',
        price: 200,
        category: 'seedling',
        stock: 50,
        description: '大玉トマトの苗',
        isActive: true,
        createdAt: '2024-01-03T12:00:00',
        updatedAt: '2024-01-12T16:45:00'
      },
      {
        id: 'PROD004',
        name: 'きゅうり苗',
        price: 180,
        category: 'seedling',
        stock: 3,
        description: '節成きゅうりの苗',
        isActive: true,
        createdAt: '2024-01-04T13:00:00',
        updatedAt: '2024-01-14T10:20:00'
      }
    ]
    setProducts(mockData)
    setFilteredProducts(mockData)
  }, [])

  useEffect(() => {
    let filtered = products

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }, [products, categoryFilter, searchTerm])

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        description: product.description,
        isActive: product.isActive
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        price: '',
        category: 'fertilizer',
        stock: '',
        description: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      price: parseInt(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock),
      description: formData.description,
      isActive: formData.isActive
    }

    if (editingProduct) {
      // 更新
      setProducts(prev =>
        prev.map(product =>
          product.id === editingProduct.id
            ? { ...product, ...productData, updatedAt: new Date().toISOString() }
            : product
        )
      )
    } else {
      // 新規追加
      const newProduct: Product = {
        ...productData,
        id: `PROD${String(products.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setProducts(prev => [...prev, newProduct])
    }

    closeModal()
  }

  const toggleProductStatus = (id: string) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, isActive: !product.isActive, updatedAt: new Date().toISOString() }
          : product
      )
    )
  }

  const deleteProduct = (id: string) => {
    if (confirm('この商品を削除しますか？')) {
      setProducts(prev => prev.filter(product => product.id !== id))
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">在庫切れ</span>
    } else if (stock <= 5) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">在庫少</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">在庫あり</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">商品管理</h2>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新規商品追加
        </button>
      </div>

      {/* フィルター・検索 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">すべて</option>
              <option value="fertilizer">肥料</option>
              <option value="pesticide">農薬</option>
              <option value="seedling">苗</option>
              <option value="tool">農具</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
            <input
              type="text"
              placeholder="商品名や説明で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 商品一覧 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categoryLabels[product.category]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{product.stock}</span>
                      {getStockStatus(product.stock)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.isActive ? '販売中' : '停止中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {product.isActive ? '停止' : '再開'}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 商品追加・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingProduct ? '商品編集' : '新規商品追加'}
                </h3>
                <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品名</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">価格</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">在庫数</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="fertilizer">肥料</option>
                    <option value="pesticide">農薬</option>
                    <option value="seedling">苗</option>
                    <option value="tool">農具</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">販売中</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProduct ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}