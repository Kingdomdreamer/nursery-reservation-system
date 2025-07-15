'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import LineTemplateEditor from '../../components/admin/LineTemplateEditor'

export default function NotificationsPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">通知管理</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          テンプレート追加
        </button>
      </div>
      <LineTemplateEditor />
    </AdminLayout>
  )
}