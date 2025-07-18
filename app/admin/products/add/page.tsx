'use client'

import React from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import ProductAdd from '../../../components/admin/ProductAdd'

export default function ProductAddPage() {
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h2 fw-bold text-dark">新規商品追加</h1>
              <button 
                onClick={() => window.location.href = '/admin/products'}
                className="btn btn-outline-secondary"
              >
                <i className="bi bi-arrow-left me-2"></i>
                商品一覧に戻る
              </button>
            </div>
          </div>
        </div>
        
        <ProductAdd />
      </div>
    </AdminLayout>
  )
}