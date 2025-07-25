'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminReports() {
  return (
    <AdminLayout 
      title="レポート" 
      description="売上・分析データの確認とエクスポート"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 売上レポート */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              売上レポート
            </h3>
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                期間別売上グラフ・商品別売上分析
              </p>
              <button className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                グラフを表示
              </button>
            </div>
          </div>
        </div>

        {/* 予約動向 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              予約動向分析
            </h3>
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                時間帯別・曜日別・商品別予約分析
              </p>
              <button className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                分析データを表示
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* エクスポート機能 */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            データエクスポート
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="mx-auto flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 mb-2">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">予約データ</h4>
              <p className="mt-1 text-xs text-gray-500">CSV形式でエクスポート</p>
              <button className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                ダウンロード
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="mx-auto flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 mb-2">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">売上レポート</h4>
              <p className="mt-1 text-xs text-gray-500">Excel形式でエクスポート</p>
              <button className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                ダウンロード
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="mx-auto flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 mb-2">
                <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m4-4v4m-6 0h8m-8 0V21a2 2 0 002 2h4a2 2 0 002-2V7M8 7h8" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">月次レポート</h4>
              <p className="mt-1 text-xs text-gray-500">PDF形式でエクスポート</p>
              <button className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                ダウンロード
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-800 mb-2">実装予定の分析機能</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• リアルタイム売上ダッシュボード</li>
          <li>• 商品別・期間別売上比較グラフ</li>
          <li>• 顧客分析（リピート率、購入傾向）</li>
          <li>• 予約キャンセル率分析</li>
          <li>• 季節性・トレンド分析</li>
          <li>• 自動レポート配信機能</li>
        </ul>
      </div>
    </AdminLayout>
  );
}