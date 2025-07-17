'use client'

import React, { useState, useEffect } from 'react'
import { LineAuthService } from '../../../services/LineAuthService'

interface LineAuthStatsProps {
  customers: any[]
  onRefresh?: () => void
}

export const LineAuthStats: React.FC<LineAuthStatsProps> = ({ customers, onRefresh }) => {
  const [stats, setStats] = useState({
    total: 0,
    linked: 0,
    unlinked: 0,
    percentage: 0
  })

  useEffect(() => {
    calculateStats()
  }, [customers])

  const calculateStats = () => {
    const total = customers.length
    const linked = customers.filter(c => c.line_user_id).length
    const unlinked = total - linked
    const percentage = total > 0 ? Math.round((linked / total) * 100) : 0

    setStats({
      total,
      linked,
      unlinked,
      percentage
    })
  }

  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <i className="bi bi-line me-2"></i>
                LINE認証統計
              </h6>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  更新
                </button>
              )}
            </div>
            
            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-0 text-primary">{stats.total}</div>
                  <small className="text-muted">総顧客数</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-0 text-success">{stats.linked}</div>
                  <small className="text-muted">LINE連携済み</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-0 text-secondary">{stats.unlinked}</div>
                  <small className="text-muted">LINE未連携</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <div className="h4 mb-0 text-info">{stats.percentage}%</div>
                  <small className="text-muted">連携率</small>
                </div>
              </div>
            </div>
            
            {/* プログレスバー */}
            <div className="mt-3">
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${stats.percentage}%` }}
                  aria-valuenow={stats.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="d-flex justify-content-between small text-muted mt-1">
                <span>LINE連携率</span>
                <span>{stats.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}