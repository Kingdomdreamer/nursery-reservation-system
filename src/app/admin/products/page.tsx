'use client';

import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SimpleProductManager } from '@/components/admin/products/SimpleProductManager';
// import { ProductsContainer } from '@/components/admin/products/ProductsContainer'; // 一時的に無効化

function ProductsContent({ onLogout }: { onLogout: () => void }) {
  return (
    <ErrorBoundary>
      <AdminLayout 
        title="商品管理（簡易版）" 
        description="商品の手動追加・編集ができます"
        onLogout={onLogout}
      >
        <SimpleProductManager />
        {/* 
        一時的に無効化 - 将来復活予定
        <ProductsContainer onLogout={onLogout} />
        */}
      </AdminLayout>
    </ErrorBoundary>
  );
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