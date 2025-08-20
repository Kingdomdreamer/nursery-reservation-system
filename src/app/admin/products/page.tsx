'use client';

import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import { ProductsContainer } from '@/components/admin/products/ProductsContainer';

function ProductsContent({ onLogout }: { onLogout: () => void }) {
  return <ProductsContainer onLogout={onLogout} />;
}


export default function AdminProductsPage() {
  return (
    <AdminAuthWrapper>
      {({ onLogout }: { onLogout: () => void }) => (
        <ProductsContent onLogout={onLogout} />
      )}
    </AdminAuthWrapper>
  );
}