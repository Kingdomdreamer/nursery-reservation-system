'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: string
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'ダッシュボード',
    icon: 'bi-speedometer2',
    description: '概要とメトリクス'
  },
  {
    href: '/admin/reservations',
    label: '予約管理',
    icon: 'bi-calendar-check',
    description: '予約の確認と管理'
  },
  {
    href: '/admin/products',
    label: '商品管理',
    icon: 'bi-box-seam',
    description: '商品と在庫の管理'
  },
  {
    href: '/admin/customers',
    label: '顧客管理',
    icon: 'bi-people',
    description: '顧客情報の管理'
  },
  {
    href: '/admin/forms',
    label: 'フォーム管理',
    icon: 'bi-file-earmark-text',
    description: '予約フォームの設定'
  },
  {
    href: '/admin/notifications',
    label: '通知管理',
    icon: 'bi-bell',
    description: '通知とメッセージ'
  }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="position-fixed w-100 h-100 d-lg-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`admin-sidebar d-lg-block ${sidebarOpen ? 'show' : ''}`}>
        <div className="d-flex flex-column h-100">
          {/* Logo / Brand */}
          <div className="p-4 border-bottom">
            <Link href="/admin" className="text-decoration-none">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-3 p-2 me-3">
                  <i className="bi bi-flower3 text-white fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-dark fw-bold">種苗店管理</h5>
                  <small className="text-muted">予約システム</small>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-grow-1 overflow-auto">
            <ul className="nav nav-sidebar flex-column">
              {navItems.map((item) => (
                <li key={item.href} className="nav-item">
                  <Link 
                    href={item.href}
                    className={`nav-link d-flex align-items-center ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`${item.icon} me-3`}></i>
                    <div>
                      <div className="fw-medium">{item.label}</div>
                      <small className="text-muted d-block">{item.description}</small>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-top">
            <div className="d-flex align-items-center text-muted">
              <i className="bi bi-person-circle me-2"></i>
              <small>管理者</small>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link d-lg-none p-0 me-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <i className="bi bi-list fs-4"></i>
              </button>
              <h4 className="mb-0 text-dark">
                {navItems.find(item => isActive(item.href))?.label || 'ダッシュボード'}
              </h4>
            </div>

            <div className="d-flex align-items-center">
              {/* Notifications */}
              <button className="btn btn-link text-muted me-3 position-relative">
                <i className="bi bi-bell fs-5"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                  3
                </span>
              </button>

              {/* Settings */}
              <button className="btn btn-link text-muted">
                <i className="bi bi-gear fs-5"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}