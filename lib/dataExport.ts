import { ExportOptions, ExportFormat, ExportType } from '../app/components/ui/DataExport/DataExport'
import { supabase } from './supabase'

/**
 * データエクスポート機能のバックエンド処理
 */

export interface ExportResult {
  success: boolean
  filename: string
  data?: any
  error?: string
}

/**
 * データをエクスポートする
 */
export const exportData = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    const data = await fetchDataByType(options)
    const filename = generateFilename(options)
    
    // ブラウザでダウンロードを実行
    const blob = createFileBlob(data, options.format)
    downloadFile(blob, filename)
    
    return {
      success: true,
      filename,
      data: data.length
    }
  } catch (error) {
    return {
      success: false,
      filename: '',
      error: error instanceof Error ? error.message : 'エクスポートに失敗しました'
    }
  }
}

/**
 * データタイプに基づいてデータを取得
 */
async function fetchDataByType(options: ExportOptions): Promise<any[]> {
  const { type, dateRange, includeDeleted } = options
  
  let query = supabase
  
  switch (type) {
    case 'reservations':
      query = supabase
        .from('reservations')
        .select(`
          *,
          customer:customers(*),
          product:products(*)
        `)
        
      if (dateRange?.start && dateRange?.end) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null)
      }
      break
      
    case 'customers':
      query = supabase
        .from('customers')
        .select('*')
        
      if (!includeDeleted) {
        query = query.is('deleted_at', null)
      }
      break
      
    case 'products':
      query = supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*)
        `)
        
      if (!includeDeleted) {
        query = query.eq('is_available', true)
      }
      break
      
    case 'forms':
      query = supabase
        .from('forms')
        .select('*')
        
      if (!includeDeleted) {
        query = query.eq('is_active', true)
      }
      break
      
    case 'all':
      // 全データの場合は個別に取得して結合
      const [reservations, customers, products, forms] = await Promise.all([
        fetchDataByType({ ...options, type: 'reservations' }),
        fetchDataByType({ ...options, type: 'customers' }),
        fetchDataByType({ ...options, type: 'products' }),
        fetchDataByType({ ...options, type: 'forms' })
      ])
      
      return {
        reservations,
        customers,
        products,
        forms,
        exported_at: new Date().toISOString()
      }
      
    default:
      throw new Error(`不明なエクスポートタイプ: ${type}`)
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`データの取得に失敗しました: ${error.message}`)
  }
  
  return data || []
}

/**
 * ファイル名を生成
 */
function generateFilename(options: ExportOptions): string {
  const { format, type } = options
  const timestamp = new Date().toISOString().split('T')[0]
  
  const typeNames = {
    reservations: 'reservations',
    customers: 'customers',
    products: 'products',
    forms: 'forms',
    all: 'all_data'
  }
  
  return `${typeNames[type]}_${timestamp}.${format}`
}

/**
 * ファイルブロブを作成
 */
function createFileBlob(data: any[], format: ExportFormat): Blob {
  switch (format) {
    case 'csv':
      return new Blob([convertToCSV(data)], { type: 'text/csv;charset=utf-8;' })
      
    case 'json':
      return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' })
      
    case 'xlsx':
      // 本来はExcelJSなどのライブラリを使用
      // 今回は簡易的にCSVで代替
      return new Blob([convertToCSV(data)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
    default:
      throw new Error(`サポートされていない形式: ${format}`)
  }
}

/**
 * データをCSV形式に変換
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return ''
  }
  
  // オブジェクトの場合は配列に変換
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) {
          return ''
        }
        // 文字列の場合はダブルクォートで囲む
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`
        }
        // オブジェクトの場合はJSON文字列化
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }
  
  return data.join('\n')
}

/**
 * ファイルをダウンロード
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  
  // 一時的にDOMに追加してクリック
  document.body.appendChild(link)
  link.click()
  
  // クリーンアップ
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 自動エクスポート設定の保存
 */
export const saveAutoExportSettings = async (settings: any): Promise<void> => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'auto_export_settings',
        value: settings,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      throw new Error(`設定の保存に失敗しました: ${error.message}`)
    }
  } catch (error) {
    throw error
  }
}

/**
 * 自動エクスポート設定の取得
 */
export const getAutoExportSettings = async (): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'auto_export_settings')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`設定の取得に失敗しました: ${error.message}`)
    }
    
    return data?.value || {
      enabled: false,
      schedule: 'weekly',
      format: 'csv',
      types: ['reservations'],
      email: null
    }
  } catch (error) {
    throw error
  }
}

/**
 * エクスポート履歴の記録
 */
export const recordExportHistory = async (
  type: ExportType,
  format: ExportFormat,
  recordCount: number,
  success: boolean,
  errorMessage?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('export_history')
      .insert({
        export_type: type,
        export_format: format,
        record_count: recordCount,
        success,
        error_message: errorMessage || null,
        exported_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('エクスポート履歴の記録に失敗:', error)
    }
  } catch (error) {
    console.error('エクスポート履歴の記録に失敗:', error)
  }
}

export default {
  exportData,
  saveAutoExportSettings,
  getAutoExportSettings,
  recordExportHistory
}