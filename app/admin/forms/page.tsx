'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import FormList from '../../components/admin/FormList'

export default function FormsPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">フォーム管理</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          フォーム作成
        </button>
      </div>
      <FormList />
    </AdminLayout>
  )
}