'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import CustomerManagement from '../../components/admin/CustomerManagement'

export default function CustomersPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">顧客管理</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          顧客追加
        </button>
      </div>
      <CustomerManagement />
    </AdminLayout>
  )
}