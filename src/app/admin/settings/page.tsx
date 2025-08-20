'use client';

import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper';
import AdminLayout from '@/components/admin/AdminLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SettingsContainer } from '@/components/admin/settings/SettingsContainer';

function SettingsContent({ onLogout }: { onLogout: () => void }) {
  return (
    <ErrorBoundary>
      <AdminLayout title="フォーム管理" description="新しいフォームを簡単に作成できます" onLogout={onLogout}>
        <SettingsContainer onLogout={onLogout} />
      </AdminLayout>
    </ErrorBoundary>
  );
}

export default function SettingsPage() {
  return (
    <AdminAuthWrapper>
      {({ onLogout }: { onLogout: () => void }) => (
        <SettingsContent onLogout={onLogout} />
      )}
    </AdminAuthWrapper>
  );
}