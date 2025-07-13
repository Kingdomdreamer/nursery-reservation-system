'use client'

import React, { useState } from 'react'

interface MenuItem {
  id: string
  label: string
  icon: string
  children?: MenuItem[]
}

interface Props {
  children: React.ReactNode
  currentPage: string
  onPageChange: (pageId: string) => void
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: '📊'
  },
  {
    id: 'reservations',
    label: '予約管理',
    icon: '📅',
    children: [
      { id: 'reservation-list', label: '予約一覧', icon: '📋' },
      { id: 'reservation-calendar', label: '予約カレンダー', icon: '🗓️' },
      { id: 'reservation-search', label: '予約検索', icon: '🔍' }
    ]
  },
  {
    id: 'products',
    label: '商品管理',
    icon: '🌱',
    children: [
      { id: 'product-list', label: '商品一覧', icon: '📦' },
      { id: 'product-add', label: '商品追加', icon: '➕' },
      { id: 'product-categories', label: 'カテゴリ管理', icon: '🏷️' }
    ]
  },
  {
    id: 'customers',
    label: '顧客管理',
    icon: '👥',
    children: [
      { id: 'customer-list', label: '顧客一覧', icon: '👤' },
      { id: 'customer-search', label: '顧客検索', icon: '🔍' }
    ]
  },
  {
    id: 'analytics',
    label: '分析・レポート',
    icon: '📈',
    children: [
      { id: 'sales-report', label: '売上レポート', icon: '💰' },
      { id: 'reservation-analytics', label: '予約分析', icon: '📊' },
      { id: 'customer-analytics', label: '顧客分析', icon: '👥' }
    ]
  },
  {
    id: 'forms',
    label: 'フォーム管理',
    icon: '📝',
    children: [
      { id: 'form-builder', label: 'フォーム作成', icon: '🛠️' },
      { id: 'form-list', label: 'フォーム一覧', icon: '📋' },
      { id: 'form-settings', label: 'フォーム設定', icon: '⚙️' }
    ]
  },
  {
    id: 'settings',
    label: '設定',
    icon: '⚙️',
    children: [
      { id: 'business-settings', label: '店舗設定', icon: '🏪' },
      { id: 'notification-settings', label: 'LINE通知設定', icon: '🔔' },
      { id: 'user-management', label: 'ユーザー管理', icon: '👨‍💼' }
    ]
  }
]

export default function AdminLayout({ children, currentPage, onPageChange }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['reservations', 'forms']))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id)
    const isActive = currentPage === item.id
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id} className="menu-item">
        <div
          className={`menu-item-button ${isActive ? 'active' : ''} level-${level}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              onPageChange(item.id)
            }
          }}
        >
          <div className="menu-item-content">
            <span className="menu-icon">{item.icon}</span>
            {!sidebarCollapsed && (
              <>
                <span className="menu-label">{item.label}</span>
                {hasChildren && (
                  <span className={`menu-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="menu-children">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-layout">
      {/* サイドバー */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <span className="logo-icon">🌱</span>
            {!sidebarCollapsed && (
              <span className="logo-text">種苗店管理</span>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">👨‍💼</span>
            {!sidebarCollapsed && (
              <div className="user-details">
                <div className="user-name">管理者</div>
                <div className="user-role">Administrator</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="admin-header">
          <div className="header-content">
            <h1 className="page-title">
              {menuItems.find(item => {
                if (item.id === currentPage) return true
                return item.children?.some(child => child.id === currentPage)
              })?.children?.find(child => child.id === currentPage)?.label ||
               menuItems.find(item => item.id === currentPage)?.label ||
               'ダッシュボード'}
            </h1>
            <div className="header-actions">
              <button className="notification-btn">
                🔔
                <span className="notification-badge">3</span>
              </button>
            </div>
          </div>
        </header>
        
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}