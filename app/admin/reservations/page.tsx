'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import ReservationListAdmin from '../../components/admin/ReservationListAdmin'

export default function ReservationsPage() {
  return (
    <AdminLayout>
      <ReservationListAdmin />
    </AdminLayout>
  )
}