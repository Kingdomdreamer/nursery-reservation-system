'use client'

import React, { useState } from 'react'
import { Icons, Icon } from '../icons/Icons'
import { NotificationDropdown } from '../common/NotificationDropdown'

interface MenuItem {
  id: string
  label: string
  icon: keyof typeof Icons
  children?: MenuItem[]
  isUnimplemented?: boolean
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
    icon: 'dashboard'
  },
  {
    id: 'reservations',
    label: '予約管理',
    icon: 'calendar',
    children: [
      { id: 'reservation-list', label: '予約一覧', icon: 'list' },
      { id: 'reservation-calendar', label: '予約カレンダー', icon: 'calendar', isUnimplemented: true },
      { id: 'reservation-search', label: '予約検索', icon: 'search', isUnimplemented: true }
    ]
  },
  {
    id: 'products',
    label: '商品管理',
    icon: 'product',
    children: [
      { id: 'product-list', label: '商品一覧', icon: 'list' },
      { id: 'product-add', label: '商品追加', icon: 'add' },
      { id: 'product-categories', label: 'カテゴリ管理', icon: 'tag' }
    ]
  },
  {
    id: 'customers',
    label: '顧客管理',
    icon: 'users',
    children: [
      { id: 'customer-list', label: '顧客管理', icon: 'user' },
      { id: 'customer-search', label: '顧客検索', icon: 'search', isUnimplemented: true }
    ]
  },
  {
    id: 'forms',
    label: 'フォーム管理',
    icon: 'document',
    children: [
      { id: 'form-builder', label: 'フォーム作成', icon: 'edit' },
      { id: 'form-list', label: 'フォーム一覧', icon: 'list' },
      { id: 'form-settings', label: 'フォーム設定', icon: 'settings', isUnimplemented: true }
    ]
  },
  {
    id: 'settings',
    label: '設定',
    icon: 'settings',
    children: [
      { id: 'business-settings', label: '店舗設定', icon: 'home', isUnimplemented: true },
      { id: 'notification-settings', label: 'LINE通知設定', icon: 'notification' },
      { id: 'user-management', label: 'ユーザー管理', icon: 'user', isUnimplemented: true }
    ]
  }
]

export default function AdminLayout({ children, currentPage, onPageChange }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['reservations', 'forms']))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    const isChildActive = item.children?.some(child => child.id === currentPage)

    return (
      <li key={item.id} className={level === 0 ? 'mb-1' : ''}>
        <button
          className={`btn d-inline-flex align-items-center rounded ${
            isActive || isChildActive
              ? 'btn-toggle-nav-active text-white'
              : 'btn-toggle collapsed text-dark'
          } w-100 text-start border-0 ${level > 0 ? 'ps-4' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              if (item.isUnimplemented) {
                alert('この機能は現在メンテナンス中です。しばらくお待ちください。')
                return
              }
              onPageChange(item.id)
            }
          }}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          <Icon icon={Icons[item.icon]} size="sm" className="me-2" />
          <span className="flex-grow-1">{item.label}</span>
          {item.isUnimplemented && (
            <small className="badge bg-warning text-dark ms-2">メンテ中</small>
          )}
          {hasChildren && (
            <Icon 
              icon={Icons.chevronDown} 
              size="xs" 
              className={`ms-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="collapse show">
            <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </ul>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="d-flex flex-nowrap min-vh-100">
      {/* サイドバー */}
      <div className={`d-flex flex-column flex-shrink-0 p-3 text-bg-light border-end ${
        sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
      }`} style={{ width: sidebarCollapsed ? '80px' : '280px', transition: 'width 0.3s ease' }}>
        
        {/* ヘッダー */}
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div className="d-flex align-items-center">
            <Icon icon={Icons.plant} size="lg" className="text-success me-2" />
            {!sidebarCollapsed && (
              <span className="fs-6 fw-bold text-success">ベジライス管理</span>
            )}
          </div>
          <button
            className="btn btn-outline-secondary btn-sm p-1"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展開' : '折りたたみ'}
          >
            <Icon icon={sidebarCollapsed ? Icons.forward : Icons.back} size="xs" />
          </button>
        </div>
        
        {/* ナビゲーション */}
        <ul className="list-unstyled ps-0 flex-grow-1">
          {menuItems.map(item => renderMenuItem(item))}
        </ul>
        
        {/* フッター */}
        <hr />
        <div className="d-flex align-items-center">
          <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: '32px', height: '32px' }}>
            <Icon icon={Icons.user} size="sm" className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ms-2">
              <h6 className="mb-0 small">管理者</h6>
              <small className="text-muted">Administrator</small>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* ヘッダー */}
        <header className="bg-white border-bottom px-4 py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <button
                className="d-md-none btn btn-outline-secondary me-3"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Icon icon={Icons.menu} size="sm" />
              </button>
              <h1 className="h4 mb-0 text-dark">
                {menuItems.find(item => {
                  if (item.id === currentPage) return true
                  return item.children?.some(child => child.id === currentPage)
                })?.children?.find(child => child.id === currentPage)?.label ||
                 menuItems.find(item => item.id === currentPage)?.label ||
                 'ダッシュボード'}
              </h1>
            </div>
            <div className="d-flex align-items-center gap-2">
              <NotificationDropdown />
            </div>
          </div>
        </header>
        
        {/* コンテンツエリア */}
        <main className="flex-grow-1 p-4 bg-light">
          {children}
        </main>
      </div>
      
      {/* モバイルオーバーレイ */}
      {mobileMenuOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none" 
             style={{ zIndex: 1050 }}
             onClick={() => setMobileMenuOpen(false)}>
          <div className="position-fixed top-0 start-0 h-100 bg-white p-3" 
               style={{ width: '280px', zIndex: 1051 }}>
            <button 
              className="btn btn-outline-secondary ms-auto d-block mb-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon icon={Icons.closeIcon} size="sm" />
            </button>
            <ul className="list-unstyled ps-0">
              {menuItems.map(item => renderMenuItem(item))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// CSSスタイル（Bootstrapベース）
const styles = `
.sidebar-collapsed {
  transition: all 0.3s ease;
}

.sidebar-expanded {
  transition: all 0.3s ease;
}

.btn-toggle {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
}

.btn-toggle:hover {
  background-color: rgba(var(--bs-dark-rgb), 0.1);
}

.btn-toggle-nav-active {
  background-color: var(--bs-primary) !important;
  color: white !important;
}

.btn-toggle-nav {
  padding-left: 1.25rem;
}

.rotate-180 {
  transform: rotate(180deg);
}

.transition-transform {
  transition: transform 0.15s ease-in-out;
}
`

// スタイルを注入
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.innerText = styles
  document.head.appendChild(styleSheet)
}