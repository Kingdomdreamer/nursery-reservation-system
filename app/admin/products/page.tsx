'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import ProductList from '../../components/admin/ProductList'

export default function ProductsPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">商品管理</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          商品追加
        </button>
      </div>
      <ProductList />
    </AdminLayout>
  )
}