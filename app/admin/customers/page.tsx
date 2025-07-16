'use client'

import AdminLayout from '../../components/admin/AdminLayout'
import CustomerManagement from '../../components/admin/CustomerManagement'

export default function CustomersPage() {
  return (
    <AdminLayout>
      <CustomerManagement />
    </AdminLayout>
  )
}