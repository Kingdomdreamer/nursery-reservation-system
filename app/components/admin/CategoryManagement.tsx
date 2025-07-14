'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Icons, Icon } from '../icons/Icons'
import { DeleteConfirmDialog } from '../common/ConfirmDialog'

interface Category {
  id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  description: string
  display_order: number
  is_active: boolean
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('カテゴリ情報の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'カテゴリ名は必須です'
    }
    
    if (formData.display_order < 0) {
      errors.display_order = '表示順序は0以上の数値を入力してください'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      if (editingCategory) {
        // 更新
        const { error } = await supabase
          .from('product_categories')
          .update(categoryData)
          .eq('id', editingCategory.id)
          
        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('product_categories')
          .insert([categoryData])
          
        if (error) throw error
      }

      // リセット
      resetForm()
      fetchCategories()
      
    } catch (error) {
      console.error('カテゴリ情報の保存に失敗しました:', error)
      alert('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active
    })
    setShowAddForm(true)
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return
    
    try {
      // まず、このカテゴリを使用している商品がないかチェック
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', categoryToDelete.id)
        .limit(1)

      if (productError) throw productError

      if (products && products.length > 0) {
        alert('このカテゴリを使用している商品が存在するため、削除できません。')
        setCategoryToDelete(null)
        return
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryToDelete.id)
        
      if (error) throw error
      
      setCategoryToDelete(null)
      fetchCategories()
      
    } catch (error) {
      console.error('カテゴリ情報の削除に失敗しました:', error)
      alert('削除に失敗しました。もう一度お試しください。')
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          is_active: !category.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', category.id)

      if (error) throw error
      fetchCategories()
    } catch (error) {
      console.error('カテゴリ状態の更新に失敗しました:', error)
      alert('状態の更新に失敗しました。')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      display_order: categories.length,
      is_active: true
    })
    setFormErrors({})
    setEditingCategory(null)
    setShowAddForm(false)
  }

  const handleInputChange = (field: keyof CategoryFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = field === 'display_order' ? parseInt(e.target.value) || 0 :
                  field === 'is_active' ? (e.target as HTMLInputElement).checked :
                  e.target.value

    setFormData({ ...formData, [field]: value })
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' })
    }
  }

  return (
    <div className="container-fluid py-4">
      {/* ヘッダー */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 text-dark fw-bold mb-1">商品カテゴリ管理</h2>
          <p className="text-muted mb-0">商品カテゴリの追加・編集・削除・並び順の管理</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-success d-flex align-items-center"
        >
          <Icon icon={Icons.add} size="sm" className="me-2" />
          新規カテゴリ追加
        </button>
      </div>

      {/* 検索フィルター */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="position-relative">
            <Icon icon={Icons.search} size="sm" className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            <input
              type="text"
              placeholder="カテゴリ名、説明で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control ps-5"
            />
          </div>
        </div>
      </div>

      {/* カテゴリ一覧 */}
      <div className="card">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">
            カテゴリ一覧 ({filteredCategories.length}件)
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center py-5">
              <Icon icon={Icons.loading} size="lg" className="animate-spin text-primary me-2" />
              <span className="text-muted">読み込み中...</span>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">表示順</th>
                    <th className="border-0">カテゴリ名</th>
                    <th className="border-0">説明</th>
                    <th className="border-0">状態</th>
                    <th className="border-0">作成日</th>
                    <th className="border-0 text-end">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <span className="badge bg-secondary">{category.display_order}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Icon icon={Icons.tag} size="sm" className="text-primary me-2" />
                          <span className="fw-medium">{category.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">
                          {category.description || '説明なし'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`btn btn-sm ${
                            category.is_active 
                              ? 'btn-outline-success' 
                              : 'btn-outline-secondary'
                          }`}
                        >
                          <Icon 
                            icon={category.is_active ? Icons.eye : Icons.eyeOff} 
                            size="xs" 
                            className="me-1" 
                          />
                          {category.is_active ? '有効' : '無効'}
                        </button>
                      </td>
                      <td className="text-muted">
                        {new Date(category.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            onClick={() => handleEdit(category)}
                            className="btn btn-sm btn-outline-primary"
                            title="編集"
                          >
                            <Icon icon={Icons.edit} size="xs" />
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(category)}
                            className="btn btn-sm btn-outline-danger"
                            title="削除"
                          >
                            <Icon icon={Icons.delete} size="xs" />
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
              <Icon icon={Icons.tag} size="xl" className="text-muted mb-3" />
              <p className="text-muted">
                {searchTerm ? '検索条件に合うカテゴリが見つかりません' : '登録されているカテゴリがありません'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn btn-success mt-2"
                >
                  初めてのカテゴリを追加
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* カテゴリ追加・編集フォームモーダル */}
      {showAddForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCategory ? 'カテゴリ編集' : '新規カテゴリ追加'}
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
                    {/* カテゴリ名 */}
                    <div className="col-md-8">
                      <label className="form-label">
                        カテゴリ名 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        placeholder="野菜の苗、花の苗など"
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">{formErrors.name}</div>
                      )}
                    </div>

                    {/* 表示順序 */}
                    <div className="col-md-4">
                      <label className="form-label">表示順序</label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={handleInputChange('display_order')}
                        className={`form-control ${formErrors.display_order ? 'is-invalid' : ''}`}
                        min="0"
                      />
                      {formErrors.display_order && (
                        <div className="invalid-feedback">{formErrors.display_order}</div>
                      )}
                    </div>

                    {/* 説明 */}
                    <div className="col-12">
                      <label className="form-label">説明</label>
                      <textarea
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        className="form-control"
                        rows={3}
                        placeholder="このカテゴリの説明を入力してください"
                      />
                    </div>

                    {/* 有効/無効 */}
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange('is_active')}
                          className="form-check-input"
                        />
                        <label htmlFor="is_active" className="form-check-label">
                          このカテゴリを有効にする
                        </label>
                      </div>
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
                    className="btn btn-primary d-flex align-items-center"
                  >
                    {saving ? (
                      <>
                        <Icon icon={Icons.loading} size="sm" className="animate-spin me-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Icon icon={Icons.save} size="sm" className="me-2" />
                        {editingCategory ? '更新' : '追加'}
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
        isOpen={!!categoryToDelete}
        title="カテゴリの削除"
        itemName={categoryToDelete?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  )
}

export default CategoryManagement