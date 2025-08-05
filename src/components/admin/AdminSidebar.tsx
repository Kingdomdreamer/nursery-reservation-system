'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  onLogout?: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'ダッシュボード',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      description: '予約一覧'
    },
    {
      name: '商品管理',
      href: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      description: '商品一覧・CSV インポート'
    },
    {
      name: 'フォーム管理',
      href: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'プリセット・商品設定'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0">
      {/* ヘッダー */}
      <div className="flex items-center h-16 px-4 bg-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">予</span>
          </div>
          <div className="ml-3">
            <p className="text-white text-sm font-medium">予約システム</p>
            <p className="text-gray-300 text-xs">管理画面</p>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href)
                    ? 'bg-gray-800 text-white border-r-2 border-blue-500'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <span className={`mr-3 ${isActive(item.href) ? 'text-blue-400' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ログアウト */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-md hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            ログアウト
          </button>
        )}
      </div>
    </div>
  );
}