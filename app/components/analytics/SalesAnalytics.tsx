import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { Button } from '../ui/Button/Button'
import { Input, Select } from '../ui/Input/Input'
import { AccessibleLoadingIndicator, AccessibleAlert } from '../ui/AccessibilityHelpers'
import { exportData } from '../../../lib/dataExport'

/**
 * 売上分析機能コンポーネント
 * 中優先度タスク：期間別・商品別売上レポート
 */

export interface SalesData {
  date: string
  total_sales: number
  order_count: number
  average_order_value: number
  top_products: ProductSales[]
}

export interface ProductSales {
  product_id: string
  product_name: string
  category: string
  quantity_sold: number
  total_revenue: number
  profit_margin: number
}

export interface DateRange {
  start: string
  end: string
}

export interface AnalyticsFilters {
  dateRange: DateRange
  productCategory?: string
  groupBy: 'daily' | 'weekly' | 'monthly'
}

export const SalesAnalytics: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    groupBy: 'daily'
  })
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadSalesData()
  }, [filters])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name')

      if (error) {
        throw error
      }

      setCategories(data || [])
    } catch (error) {
      console.error('カテゴリの読み込みに失敗:', error)
    }
  }

  const loadSalesData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .rpc('get_sales_analytics', {
          start_date: filters.dateRange.start,
          end_date: filters.dateRange.end,
          category_id: filters.productCategory || null,
          group_by: filters.groupBy
        })

      if (error) {
        throw error
      }

      setSalesData(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : '売上データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const handleExportData = async () => {
    try {
      await exportData({
        format: 'csv',
        type: 'reservations',
        dateRange: filters.dateRange
      })
    } catch (error) {
      console.error('エクスポートに失敗:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const totalSales = salesData.reduce((sum, data) => sum + data.total_sales, 0)
  const totalOrders = salesData.reduce((sum, data) => sum + data.order_count, 0)
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  return (
    <div className="sales-analytics">
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">売上分析</h3>
        </div>
        <div className="card-body">
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <Input
                type="date"
                label="開始日"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange({
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
                required
                aria-describedby="start-date-help"
              />
              <div id="start-date-help" className="form-text">
                分析期間の開始日を選択してください
              </div>
            </div>
            
            <div className="col-md-3">
              <Input
                type="date"
                label="終了日"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange({
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
                required
                aria-describedby="end-date-help"
              />
              <div id="end-date-help" className="form-text">
                分析期間の終了日を選択してください
              </div>
            </div>
            
            <div className="col-md-3">
              <Select
                label="商品カテゴリ"
                value={filters.productCategory || ''}
                onChange={(e) => handleFilterChange({
                  productCategory: e.target.value || undefined
                })}
                placeholder="全カテゴリ"
                aria-describedby="category-help"
              >
                <option value="">全カテゴリ</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <div id="category-help" className="form-text">
                分析対象のカテゴリを選択してください
              </div>
            </div>
            
            <div className="col-md-3">
              <Select
                label="集計単位"
                value={filters.groupBy}
                onChange={(e) => handleFilterChange({
                  groupBy: e.target.value as AnalyticsFilters['groupBy']
                })}
                required
                aria-describedby="group-by-help"
              >
                <option value="daily">日別</option>
                <option value="weekly">週別</option>
                <option value="monthly">月別</option>
              </Select>
              <div id="group-by-help" className="form-text">
                データの集計単位を選択してください
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>分析結果</h4>
            <Button
              variant="outline-primary"
              onClick={handleExportData}
              aria-label="売上データをエクスポート"
            >
              <i className="bi bi-download me-2" aria-hidden="true"></i>
              エクスポート
            </Button>
          </div>

          {error && (
            <AccessibleAlert type="error" className="mb-4">
              {error}
            </AccessibleAlert>
          )}

          {loading ? (
            <AccessibleLoadingIndicator 
              label="売上データを読み込み中..."
              className="py-5"
            />
          ) : (
            <>
              {/* サマリーカード */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-currency-yen me-2" aria-hidden="true"></i>
                        総売上
                      </h5>
                      <p className="card-text h3" role="status" aria-live="polite">
                        {formatCurrency(totalSales)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-cart me-2" aria-hidden="true"></i>
                        注文数
                      </h5>
                      <p className="card-text h3" role="status" aria-live="polite">
                        {totalOrders.toLocaleString()}件
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-graph-up me-2" aria-hidden="true"></i>
                        平均注文額
                      </h5>
                      <p className="card-text h3" role="status" aria-live="polite">
                        {formatCurrency(averageOrderValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 売上推移テーブル */}
              <div className="table-responsive">
                <table className="table table-striped">
                  <caption className="visually-hidden">
                    {filters.groupBy}別の売上推移データ
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">期間</th>
                      <th scope="col">売上金額</th>
                      <th scope="col">注文数</th>
                      <th scope="col">平均注文額</th>
                      <th scope="col">前期比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((data, index) => {
                      const previousData = salesData[index - 1]
                      const growthRate = previousData 
                        ? ((data.total_sales - previousData.total_sales) / previousData.total_sales) * 100
                        : 0

                      return (
                        <tr key={data.date}>
                          <td>{formatDate(data.date)}</td>
                          <td>{formatCurrency(data.total_sales)}</td>
                          <td>{data.order_count.toLocaleString()}</td>
                          <td>{formatCurrency(data.average_order_value)}</td>
                          <td>
                            {index > 0 && (
                              <span className={`badge bg-${growthRate >= 0 ? 'success' : 'danger'}`}>
                                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 人気商品ランキング */}
              {salesData.length > 0 && salesData[0].top_products && (
                <div className="mt-4">
                  <h4>人気商品ランキング</h4>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <caption className="visually-hidden">
                        選択期間における人気商品のランキング
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">順位</th>
                          <th scope="col">商品名</th>
                          <th scope="col">カテゴリ</th>
                          <th scope="col">販売数</th>
                          <th scope="col">売上金額</th>
                          <th scope="col">利益率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData
                          .flatMap(data => data.top_products)
                          .reduce((acc, product) => {
                            const existing = acc.find(p => p.product_id === product.product_id)
                            if (existing) {
                              existing.quantity_sold += product.quantity_sold
                              existing.total_revenue += product.total_revenue
                            } else {
                              acc.push({ ...product })
                            }
                            return acc
                          }, [] as ProductSales[])
                          .sort((a, b) => b.total_revenue - a.total_revenue)
                          .slice(0, 10)
                          .map((product, index) => (
                            <tr key={product.product_id}>
                              <td>
                                <span className="badge bg-primary">{index + 1}</span>
                              </td>
                              <td>{product.product_name}</td>
                              <td>{product.category}</td>
                              <td>{product.quantity_sold.toLocaleString()}</td>
                              <td>{formatCurrency(product.total_revenue)}</td>
                              <td>
                                <span className={`badge bg-${product.profit_margin >= 20 ? 'success' : 'warning'}`}>
                                  {product.profit_margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 売上分析用のSQL関数作成スクリプト
 * データベースに以下の関数を作成する必要があります
 */
export const createSalesAnalyticsFunction = `
CREATE OR REPLACE FUNCTION get_sales_analytics(
  start_date DATE,
  end_date DATE,
  category_id UUID DEFAULT NULL,
  group_by TEXT DEFAULT 'daily'
)
RETURNS TABLE (
  date TEXT,
  total_sales DECIMAL,
  order_count INTEGER,
  average_order_value DECIMAL,
  top_products JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN group_by = 'daily' THEN DATE_TRUNC('day', r.created_at)::TEXT
      WHEN group_by = 'weekly' THEN DATE_TRUNC('week', r.created_at)::TEXT
      WHEN group_by = 'monthly' THEN DATE_TRUNC('month', r.created_at)::TEXT
    END as date,
    SUM(ri.quantity * ri.unit_price)::DECIMAL as total_sales,
    COUNT(DISTINCT r.id)::INTEGER as order_count,
    AVG(ri.quantity * ri.unit_price)::DECIMAL as average_order_value,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'product_id', p.id,
        'product_name', p.name,
        'category', pc.name,
        'quantity_sold', SUM(ri.quantity),
        'total_revenue', SUM(ri.quantity * ri.unit_price),
        'profit_margin', COALESCE(p.profit_margin, 0)
      )
    ) as top_products
  FROM reservations r
  JOIN reservation_items ri ON r.id = ri.reservation_id
  JOIN products p ON ri.product_id = p.id
  LEFT JOIN product_categories pc ON p.category_id = pc.id
  WHERE r.created_at >= start_date 
    AND r.created_at <= end_date
    AND (category_id IS NULL OR p.category_id = category_id)
    AND r.status = 'confirmed'
  GROUP BY 
    CASE 
      WHEN group_by = 'daily' THEN DATE_TRUNC('day', r.created_at)
      WHEN group_by = 'weekly' THEN DATE_TRUNC('week', r.created_at)
      WHEN group_by = 'monthly' THEN DATE_TRUNC('month', r.created_at)
    END
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;
`

export default SalesAnalytics