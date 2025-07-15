'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import ReservationListAdmin from '../../components/admin/ReservationListAdmin'

export default function ReservationsPage() {
  return (
    <AdminLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">予約管理</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          新規予約
        </button>
      </div>
      <ReservationListAdmin />
    </AdminLayout>
  )
}