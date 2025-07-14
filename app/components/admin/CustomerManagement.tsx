'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Icons, Icon } from '../icons/Icons'
import { DeleteConfirmDialog } from '../common/ConfirmDialog'

interface Customer {
  id: string
  name: string
  furigana?: string
  email?: string
  phone?: string
  postal_code?: string
  prefecture?: string
  city?: string
  address?: string
  birth_date?: string
  gender?: string
  created_at: string
  updated_at: string
}

interface CustomerFormData {
  name: string
  furigana: string
  email: string
  phone: string
  postal_code: string
  prefecture: string
  city: string
  address: string
  birth_date: string
  gender: string
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    furigana: '',
    email: '',
    phone: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address: '',
    birth_date: '',
    gender: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('顧客情報の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = '氏名は必須です'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = '電話番号は必須です'
    } else if (!/^[\d\-\+\(\)\s]+$/.test(formData.phone)) {
      errors.phone = '有効な電話番号を入力してください'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '有効なメールアドレスを入力してください'
    }
    
    if (formData.postal_code && !/^\d{3}-?\d{4}$/.test(formData.postal_code)) {
      errors.postal_code = '有効な郵便番号を入力してください（例: 123-4567）'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const customerData = {
        name: formData.name.trim(),
        furigana: formData.furigana.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        postal_code: formData.postal_code.trim() || null,
        prefecture: formData.prefecture.trim() || null,
        city: formData.city.trim() || null,
        address: formData.address.trim() || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        updated_at: new Date().toISOString()
      }

      if (editingCustomer) {
        // 更新
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id)
          
        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('customers')
          .insert([customerData])
          
        if (error) throw error
      }

      // リセット
      resetForm()
      fetchCustomers()
      
    } catch (error) {
      console.error('顧客情報の保存に失敗しました:', error)
      alert('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      furigana: customer.furigana || '',
      email: customer.email || '',
      phone: customer.phone || '',
      postal_code: customer.postal_code || '',
      prefecture: customer.prefecture || '',
      city: customer.city || '',
      address: customer.address || '',
      birth_date: customer.birth_date || '',
      gender: customer.gender || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async () => {
    if (!customerToDelete) return
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id)
        
      if (error) throw error
      
      setCustomerToDelete(null)
      fetchCustomers()
      
    } catch (error) {
      console.error('顧客情報の削除に失敗しました:', error)
      alert('削除に失敗しました。もう一度お試しください。')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      furigana: '',
      email: '',
      phone: '',
      postal_code: '',
      prefecture: '',
      city: '',
      address: '',
      birth_date: '',
      gender: ''
    })
    setFormErrors({})
    setEditingCustomer(null)
    setShowAddForm(false)
  }

  const handleInputChange = (field: keyof CustomerFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' })
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">顧客管理</h2>
          <p className="text-gray-600">顧客情報の一覧・追加・編集・削除</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-modern btn-primary-modern flex items-center space-x-2"
        >
          <Icon icon={Icons.add} size="sm" />
          <span>新規顧客追加</span>
        </button>
      </div>

      {/* 検索フィルター */}
      <div className="admin-card">
        <div className="admin-card-content">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon={Icons.search} size="sm" className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="名前、電話番号、メールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 顧客一覧 */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            顧客一覧 ({filteredCustomers.length}件)
          </h3>
        </div>
        <div className="admin-card-content">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon={Icons.loading} size="lg" className="animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      顧客情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      連絡先
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      住所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 lg:h-12 lg:w-12">
                            <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <Icon icon={Icons.user} size="sm" className="text-gray-500 lg:text-base" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm lg:text-base font-medium text-gray-900">
                              {customer.name}
                            </div>
                            {customer.furigana && (
                              <div className="text-sm lg:text-base text-gray-500">
                                {customer.furigana}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.phone && (
                            <div className="flex items-center">
                              <Icon icon={Icons.phone} size="xs" className="text-gray-400 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center mt-1">
                              <Icon icon={Icons.mail} size="xs" className="text-gray-400 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.postal_code && (
                            <div>〒{customer.postal_code}</div>
                          )}
                          {(customer.prefecture || customer.city || customer.address) && (
                            <div className="text-sm text-gray-600">
                              {customer.prefecture}{customer.city}{customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="編集"
                          >
                            <Icon icon={Icons.edit} size="sm" />
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            className="text-red-600 hover:text-red-900"
                            title="削除"
                          >
                            <Icon icon={Icons.delete} size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Icon icon={Icons.users} size="xl" className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? '検索条件に合う顧客が見つかりません' : '登録されている顧客がいません'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 btn-modern btn-primary-modern"
                >
                  初めての顧客を追加
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 顧客追加・編集フォームモーダル */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCustomer ? '顧客情報編集' : '新規顧客追加'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={Icons.closeIcon} size="md" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 氏名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="山田 太郎"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* フリガナ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.furigana}
                    onChange={handleInputChange('furigana')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ヤマダ タロウ"
                  />
                </div>

                {/* 電話番号 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="090-1234-5678"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>

                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* 郵便番号 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={handleInputChange('postal_code')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.postal_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="123-4567"
                  />
                  {formErrors.postal_code && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.postal_code}</p>
                  )}
                </div>

                {/* 都道府県 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    都道府県
                  </label>
                  <input
                    type="text"
                    value={formData.prefecture}
                    onChange={handleInputChange('prefecture')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="東京都"
                  />
                </div>

                {/* 市区町村 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    市区町村
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange('city')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="新宿区"
                  />
                </div>

                {/* 住所 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange('address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="西新宿1-1-1"
                  />
                </div>

                {/* 生年月日 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生年月日
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={handleInputChange('birth_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 性別 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <select
                    value={formData.gender}
                    onChange={handleInputChange('gender')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="その他">その他</option>
                    <option value="回答しない">回答しない</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <Icon icon={Icons.loading} size="sm" className="animate-spin" />
                      <span>保存中...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon={Icons.save} size="sm" />
                      <span>{editingCustomer ? '更新' : '追加'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        isOpen={!!customerToDelete}
        title="顧客情報の削除"
        itemName={customerToDelete?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  )
}

export default CustomerManagement