'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import Link from 'next/link';

export default function AdminSystem() {
  return (
    <AdminLayout 
      title="システム設定" 
      description="システムのメンテナンス・デバッグ・設定"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* デバッグ・診断 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              デバッグ・診断
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">環境変数確認</p>
                  <p className="text-xs text-gray-500">Supabase・LINE設定の確認</p>
                </div>
                <Link
                  href="/debug"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  確認画面へ
                </Link>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">データベース接続</p>
                  <p className="text-xs text-gray-500">Supabase接続テスト</p>
                </div>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  テスト実行
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">LINE API接続</p>
                  <p className="text-xs text-gray-500">LIFF・Messaging API確認</p>
                </div>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  テスト実行
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">ログ確認</p>
                  <p className="text-xs text-gray-500">エラーログ・アクセスログ</p>
                </div>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  ログ表示
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* セキュリティ設定 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              セキュリティ設定
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">管理者パスワード</p>
                  <p className="text-xs text-gray-500">現在: 固定パスワード</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  要改善
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">セッション管理</p>
                  <p className="text-xs text-gray-500">自動ログアウト設定</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  未実装
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">アクセス制御</p>
                  <p className="text-xs text-gray-500">IP制限・権限管理</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  未実装
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">監査ログ</p>
                  <p className="text-xs text-gray-500">管理者操作履歴</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  未実装
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* システム情報 */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            システム情報
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">アプリケーション</dt>
              <dd className="mt-1 text-sm text-gray-900">Next.js 15.4.3</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">データベース</dt>
              <dd className="mt-1 text-sm text-gray-900">Supabase PostgreSQL</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">認証</dt>
              <dd className="mt-1 text-sm text-gray-900">LINE LIFF</dd>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <dt className="text-sm font-medium text-gray-500">デプロイ</dt>
              <dd className="mt-1 text-sm text-gray-900">Vercel</dd>
            </div>
          </div>
        </div>
      </div>

      {/* メンテナンス */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            メンテナンス
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="h-8 w-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm font-medium text-gray-900">キャッシュクリア</span>
              <span className="text-xs text-gray-500">アプリケーションキャッシュをクリア</span>
            </button>

            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="text-sm font-medium text-gray-900">データバックアップ</span>
              <span className="text-xs text-gray-500">データベースの手動バックアップ</span>
            </button>

            <button className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="h-8 w-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">パフォーマンス分析</span>
              <span className="text-xs text-gray-500">システムパフォーマンスをチェック</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ セキュリティに関する重要な改善事項</h4>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• 管理者パスワードを環境変数に移行する必要があります</li>
          <li>• セッション管理とタイムアウト機能を実装してください</li>
          <li>• 管理者操作の監査ログを記録することを推奨します</li>
          <li>• 本番環境では適切なアクセス制御の設定が必要です</li>
        </ul>
      </div>
    </AdminLayout>
  );
}