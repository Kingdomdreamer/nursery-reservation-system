'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationPanel from './NotificationPanel'

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
  const [isDesktop, setIsDesktop] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 992)
    }
    
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const handleNotificationClick = () => {
    setShowNotifications(true)
  }

  const handleSettingsClick = () => {
    setShowSettings(true)
    // 設定画面へ遷移
    window.location.href = '/admin/settings'
  }

  return (
    <div className="d-flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="position-fixed w-100 h-100 d-lg-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`bg-white border-end shadow-sm position-fixed ${sidebarOpen ? 'd-block' : 'd-none d-lg-block'}`}
           style={{ 
             width: '280px', 
             height: '100vh', 
             zIndex: 1030,
             left: 0,
             top: 0,
             background: 'linear-gradient(180deg, #7cb342 0%, #8bc34a 100%)'
           }}>
        <div className="d-flex flex-column h-100">
          {/* Logo / Brand */}
          <div className="p-4 border-bottom border-white border-opacity-25">
            <Link href="/admin" className="text-decoration-none">
              <div className="d-flex align-items-center">
                <div className="rounded-3 p-2 me-3" style={{ 
                  background: 'rgba(255, 255, 255, 0.2)'
                }}>
                  <i className="bi bi-flower3 text-white fs-4"></i>
                </div>
                <div>
                  <h5 className="mb-0 text-white fw-bold">ベジライス</h5>
                  <small className="text-white text-opacity-75">予約管理システム</small>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-grow-1 overflow-auto">
            <ul className="nav flex-column">
              {navItems.map((item) => (
                <li key={item.href} className="nav-item">
                  <Link 
                    href={item.href}
                    className={`nav-link d-flex align-items-center py-3 px-4 text-decoration-none ${
                      isActive(item.href) 
                        ? 'bg-white bg-opacity-25 text-white border-end border-white border-3' 
                        : 'text-white text-opacity-75 hover:bg-white hover:bg-opacity-10'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <i className={`${item.icon} me-3`}></i>
                    <div>
                      <div className="fw-medium">{item.label}</div>
                      <small className={`${isActive(item.href) ? 'text-white text-opacity-75' : 'text-white text-opacity-50'} d-block`}>
                        {item.description}
                      </small>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-top border-white border-opacity-25">
            <div className="d-flex align-items-center text-white text-opacity-75">
              <i className="bi bi-person-circle me-2"></i>
              <small>管理者</small>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1" style={{ 
        marginLeft: '280px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)'
      }}>
        {/* Header */}
        <header className="border-bottom shadow-sm sticky-top" style={{ 
          height: '64px', 
          zIndex: 1020,
          background: 'linear-gradient(90deg, #8bc34a 0%, #7cb342 100%)'
        }}>
          <div className="d-flex align-items-center justify-content-between w-100 h-100 px-4">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-light d-lg-none me-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <i className="bi bi-list fs-4 text-white"></i>
              </button>
              <h4 className="mb-0 text-white fw-bold">
                {navItems.find(item => isActive(item.href))?.label || 'ダッシュボード'}
              </h4>
            </div>

            <div className="d-flex align-items-center">
              {/* Notifications */}
              <button 
                onClick={handleNotificationClick}
                className="btn btn-outline-light text-white me-3 position-relative border-white"
                title="通知を確認"
              >
                <i className="bi bi-bell fs-5"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                  3
                </span>
              </button>

              {/* Settings */}
              <button 
                onClick={handleSettingsClick}
                className="btn btn-outline-light text-white border-white"
                title="設定"
              >
                <i className="bi bi-gear fs-5"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4" style={{ background: 'transparent' }}>
          {children}
        </div>
      </main>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  )
}