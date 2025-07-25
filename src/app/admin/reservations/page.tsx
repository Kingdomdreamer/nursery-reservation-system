'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminReservations() {
  return (
    <AdminLayout 
      title="予約管理" 
      description="予約の詳細管理・検索・編集を行います"
    >
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m4-4v4m-6 0h8m-8 0V21a2 2 0 002 2h4a2 2 0 002-2V7M8 7h8" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">予約管理機能</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              この画面では詳細な予約管理機能を提供します。検索・フィルタ・一括操作・CSVエクスポートなどの機能を実装予定です。
            </p>
            <p className="mt-4 text-xs text-gray-400">
              現在は<strong>ダッシュボード</strong>で基本的な予約一覧・詳細確認ができます。
            </p>
            <div className="mt-6">
              <a
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                ダッシュボードに戻る
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">実装予定の機能</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 高度な検索・フィルタ機能（日付範囲、顧客名、商品、ステータス）</li>
          <li>• 予約の一括操作（ステータス変更、通知送信）</li>
          <li>• CSVエクスポート機能</li>
          <li>• 予約カレンダー表示</li>
          <li>• 売上レポート生成</li>
        </ul>
      </div>
    </AdminLayout>
  );
}