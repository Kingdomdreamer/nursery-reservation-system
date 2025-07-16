'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import LineTemplateEditor from '../../components/admin/LineTemplateEditor'

export default function NotificationsPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">通知管理</h1>
      </div>
      <LineTemplateEditor />
    </AdminLayout>
  )
}