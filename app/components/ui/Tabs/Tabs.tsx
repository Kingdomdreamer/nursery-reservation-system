import React, { useState } from 'react'

/**
 * タブのデータ型
 */
export interface TabData {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  badge?: string | number
  content?: React.ReactNode
}

/**
 * タブコンポーネントのプロパティ
 */
export interface TabsProps {
  tabs: TabData[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  variant?: 'tabs' | 'pills'
  justified?: boolean
  vertical?: boolean
  className?: string
  tabsClassName?: string
  contentClassName?: string
}

/**
 * 個別タブのプロパティ
 */
export interface TabProps {
  tab: TabData
  isActive: boolean
  onClick: (tabId: string) => void
  variant?: 'tabs' | 'pills'
}

/**
 * 個別タブコンポーネント
 */
const Tab: React.FC<TabProps> = ({
  tab,
  isActive,
  onClick,
  variant = 'tabs'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tab.disabled) {
      onClick(tab.id)
    }
  }

  const linkClasses = [
    'nav-link',
    isActive ? 'active' : '',
    tab.disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ')

  return (
    <li className="nav-item" role="presentation">
      <button
        className={linkClasses}
        onClick={handleClick}
        type="button"
        role="tab"
        aria-controls={`${tab.id}-content`}
        aria-selected={isActive}
        disabled={tab.disabled}
      >
        {tab.icon && <span className="me-2">{tab.icon}</span>}
        {tab.label}
        {tab.badge && (
          <span className="badge bg-primary ms-2">{tab.badge}</span>
        )}
      </button>
    </li>
  )
}

/**
 * タブコンテンツコンポーネント
 */
const TabContent: React.FC<{
  tabs: TabData[]
  activeTab: string
  className?: string
}> = ({ tabs, activeTab, className = '' }) => {
  const activeTabData = tabs.find(tab => tab.id === activeTab)

  if (!activeTabData || !activeTabData.content) {
    return null
  }

  return (
    <div className={`tab-content ${className}`}>
      <div
        className="tab-pane fade show active"
        id={`${activeTab}-content`}
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
      >
        {activeTabData.content}
      </div>
    </div>
  )
}

/**
 * 再利用可能なタブコンポーネント
 * Bootstrap 5ナビゲーションタブをベースとした実装
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'tabs',
  justified = false,
  vertical = false,
  className = '',
  tabsClassName = '',
  contentClassName = ''
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab || tabs[0]?.id || ''
  )

  const currentActiveTab = activeTab || internalActiveTab

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
  }

  // タブナビゲーションのクラス名
  const navClasses = [
    'nav',
    variant === 'tabs' ? 'nav-tabs' : 'nav-pills',
    justified ? 'nav-justified' : '',
    vertical ? 'flex-column' : '',
    tabsClassName
  ].filter(Boolean).join(' ')

  // コンテナのクラス名
  const containerClasses = [
    vertical ? 'd-flex' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <ul className={navClasses} role="tablist">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={currentActiveTab === tab.id}
            onClick={handleTabChange}
            variant={variant}
          />
        ))}
      </ul>
      
      <TabContent
        tabs={tabs}
        activeTab={currentActiveTab}
        className={contentClassName}
      />
    </div>
  )
}

/**
 * 制御されたタブコンポーネント（外部で状態管理）
 */
export const ControlledTabs: React.FC<Omit<TabsProps, 'activeTab' | 'onTabChange'> & {
  activeTab: string
  onTabChange: (tabId: string) => void
}> = ({ activeTab, onTabChange, ...props }) => {
  return (
    <Tabs
      {...props}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  )
}

/**
 * 非制御タブコンポーネント（内部で状態管理）
 */
export const UncontrolledTabs: React.FC<Omit<TabsProps, 'activeTab' | 'onTabChange'> & {
  defaultActiveTab?: string
  onTabChange?: (tabId: string) => void
}> = ({ defaultActiveTab, onTabChange, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || props.tabs[0]?.id || '')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  return (
    <Tabs
      {...props}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  )
}

/**
 * シンプルなタブナビゲーション（コンテンツなし）
 */
export const TabNavigation: React.FC<Omit<TabsProps, 'contentClassName'> & {
  children?: React.ReactNode
}> = ({ children, ...props }) => {
  const { tabs, activeTab, onTabChange, variant = 'tabs', justified = false, vertical = false, tabsClassName = '' } = props
  
  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab || tabs[0]?.id || ''
  )

  const currentActiveTab = activeTab || internalActiveTab

  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId)
    } else {
      setInternalActiveTab(tabId)
    }
  }

  // タブナビゲーションのクラス名
  const navClasses = [
    'nav',
    variant === 'tabs' ? 'nav-tabs' : 'nav-pills',
    justified ? 'nav-justified' : '',
    vertical ? 'flex-column' : '',
    tabsClassName
  ].filter(Boolean).join(' ')

  return (
    <>
      <ul className={navClasses} role="tablist">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={currentActiveTab === tab.id}
            onClick={handleTabChange}
            variant={variant}
          />
        ))}
      </ul>
      {children}
    </>
  )
}

export default Tabs