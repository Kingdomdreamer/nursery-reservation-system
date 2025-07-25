'use client';

import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  onLogout?: () => void;
}

export default function AdminLayout({ 
  children, 
  title, 
  description,
  onLogout 
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* サイドバー */}
      <AdminSidebar onLogout={onLogout} />
      
      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
              </div>
              
              {/* 追加のヘッダーアクション */}
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date().toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}