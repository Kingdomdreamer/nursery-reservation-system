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
    <div>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h2 fw-bold text-dark">顧客管理</h2>
              <p className="text-muted">顧客情報の一覧・追加・編集・削除</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              <i className="bi bi-person-plus me-2"></i>
              新規顧客追加
            </button>
          </div>
        </div>
      </div>

      {/* 検索フィルター */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="名前、電話番号、メールアドレスで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 顧客一覧 */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                顧客一覧 ({filteredCustomers.length}件)
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="loading-spinner me-2"></div>
                  <span className="text-muted">読み込み中...</span>
                </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th className="fw-medium text-muted text-uppercase small">
                      顧客情報
                    </th>
                    <th className="fw-medium text-muted text-uppercase small">
                      連絡先
                    </th>
                    <th className="fw-medium text-muted text-uppercase small">
                      住所
                    </th>
                    <th className="fw-medium text-muted text-uppercase small">
                      登録日
                    </th>
                    <th className="fw-medium text-muted text-uppercase small text-end">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-3 py-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <i className="bi bi-person text-muted"></i>
                            </div>
                          </div>
                          <div>
                            <div className="fw-medium text-dark">
                              {customer.name}
                            </div>
                            {customer.furigana && (
                              <div className="small text-muted">
                                {customer.furigana}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          {customer.phone && (
                            <div className="d-flex align-items-center small">
                              <i className="bi bi-telephone me-1 text-muted"></i>
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="d-flex align-items-center small mt-1">
                              <i className="bi bi-envelope me-1 text-muted"></i>
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="small">
                          {customer.postal_code && (
                            <div>〒{customer.postal_code}</div>
                          )}
                          {(customer.prefecture || customer.city || customer.address) && (
                            <div className="text-muted">
                              {customer.prefecture}{customer.city}{customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 small text-muted">
                        {new Date(customer.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="btn btn-outline-primary btn-sm"
                            title="編集"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => setCustomerToDelete(customer)}
                            className="btn btn-outline-danger btn-sm"
                            title="削除"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-people text-muted" style={{ fontSize: '4rem' }}></i>
                  <p className="text-muted mt-3">
                    {searchTerm ? '検索条件に合う顧客が見つかりません' : '登録されている顧客がいません'}
                  </p>
                  {searchTerm && (
                    <p className="text-muted small">検索条件を変更してもう一度お試しください。</p>
                  )}
                </div>
          )}
        </div>
      </div>

      {/* 顧客追加・編集フォームモーダル */}
      {showAddForm && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCustomer ? '顧客情報編集' : '新規顧客追加'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* 氏名 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        氏名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        className={`form-control ${
                          formErrors.name ? 'is-invalid' : ''
                        }`}
                        placeholder="山田 太郎"
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">{formErrors.name}</div>
                      )}
                    </div>

                    {/* フリガナ */}
                    <div className="col-md-6">
                      <label className="form-label">
                        フリガナ
                      </label>
                      <input
                        type="text"
                        value={formData.furigana}
                        onChange={handleInputChange('furigana')}
                        className="form-control"
                        placeholder="ヤマダ タロウ"
                      />
                    </div>

                    {/* 電話番号 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        電話番号 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange('phone')}
                        className={`form-control ${
                          formErrors.phone ? 'is-invalid' : ''
                        }`}
                        placeholder="090-1234-5678"
                      />
                      {formErrors.phone && (
                        <div className="invalid-feedback">{formErrors.phone}</div>
                      )}
                    </div>

                    {/* メールアドレス */}
                    <div className="col-md-6">
                      <label className="form-label">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        className={`form-control ${
                          formErrors.email ? 'is-invalid' : ''
                        }`}
                        placeholder="example@email.com"
                      />
                      {formErrors.email && (
                        <div className="invalid-feedback">{formErrors.email}</div>
                      )}
                    </div>

                    {/* 郵便番号 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        郵便番号
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={handleInputChange('postal_code')}
                        className={`form-control ${
                          formErrors.postal_code ? 'is-invalid' : ''
                        }`}
                        placeholder="123-4567"
                      />
                      {formErrors.postal_code && (
                        <div className="invalid-feedback">{formErrors.postal_code}</div>
                      )}
                    </div>

                    {/* 都道府県 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        都道府県
                      </label>
                      <input
                        type="text"
                        value={formData.prefecture}
                        onChange={handleInputChange('prefecture')}
                        className="form-control"
                        placeholder="東京都"
                      />
                    </div>

                    {/* 市区町村 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        市区町村
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={handleInputChange('city')}
                        className="form-control"
                        placeholder="新宿区"
                      />
                    </div>

                    {/* 住所 */}
                    <div className="col-12">
                      <label className="form-label">
                        住所
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={handleInputChange('address')}
                        className="form-control"
                        placeholder="西新宿1-1-1"
                      />
                    </div>

                    {/* 生年月日 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        生年月日
                      </label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={handleInputChange('birth_date')}
                        className="form-control"
                      />
                    </div>

                    {/* 性別 */}
                    <div className="col-md-6">
                      <label className="form-label">
                        性別
                      </label>
                      <select
                        value={formData.gender}
                        onChange={handleInputChange('gender')}
                        className="form-select"
                      >
                        <option value="">選択してください</option>
                        <option value="男性">男性</option>
                        <option value="女性">女性</option>
                        <option value="その他">その他</option>
                        <option value="回答しない">回答しない</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>
                        <span className="loading-spinner me-2"></span>
                        保存中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        {editingCustomer ? '更新' : '追加'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
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