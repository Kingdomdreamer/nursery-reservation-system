import React, { useState, useCallback } from 'react'
import { Button } from '../Button/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../Modal/Modal'
import { AccessibleLoadingIndicator, AccessibleAlert } from '../AccessibilityHelpers'

/**
 * データエクスポート機能のコンポーネント
 * 中優先度タスク：定期的なデータエクスポート機能
 */

export type ExportFormat = 'csv' | 'json' | 'xlsx'
export type ExportType = 'reservations' | 'customers' | 'products' | 'forms' | 'all'

export interface ExportOptions {
  format: ExportFormat
  type: ExportType
  dateRange?: {
    start: string
    end: string
  }
  includeDeleted?: boolean
}

export interface DataExportProps {
  onExport: (options: ExportOptions) => Promise<void>
  className?: string
}

export const DataExport: React.FC<DataExportProps> = ({ onExport, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'reservations',
    includeDeleted: false
  })

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      await onExport(options)
      setSuccess('データのエクスポートが完了しました')
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました')
    } finally {
      setIsExporting(false)
    }
  }, [onExport, options])

  const handleClose = useCallback(() => {
    if (!isExporting) {
      setIsOpen(false)
      setError(null)
      setSuccess(null)
    }
  }, [isExporting])

  const formatLabels: Record<ExportFormat, string> = {
    csv: 'CSV',
    json: 'JSON',
    xlsx: 'Excel (XLSX)'
  }

  const typeLabels: Record<ExportType, string> = {
    reservations: '予約データ',
    customers: '顧客データ',
    products: '商品データ',
    forms: 'フォームデータ',
    all: '全データ'
  }

  return (
    <>
      <Button
        variant="outline-primary"
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label="データエクスポート"
      >
        <i className="bi bi-download me-2" aria-hidden="true"></i>
        データエクスポート
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="データエクスポート"
        size="md"
        centered
        keyboard={!isExporting}
        backdrop={isExporting ? 'static' : true}
        aria-describedby="export-modal-description"
      >
        <ModalBody>
          <div id="export-modal-description">
            <p className="mb-4">
              システムのデータをエクスポートします。形式とエクスポート対象を選択してください。
            </p>

            {error && (
              <AccessibleAlert type="error" className="mb-4">
                {error}
              </AccessibleAlert>
            )}

            {success && (
              <AccessibleAlert type="success" className="mb-4">
                {success}
              </AccessibleAlert>
            )}

            {isExporting && (
              <AccessibleLoadingIndicator
                label="データをエクスポート中..."
                className="mb-4"
              />
            )}

            <div className="mb-4">
              <label htmlFor="export-format" className="form-label">
                エクスポート形式 <span className="text-danger">*</span>
              </label>
              <select
                id="export-format"
                className="form-select"
                value={options.format}
                onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                disabled={isExporting}
                aria-describedby="format-help"
                required
              >
                {Object.entries(formatLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div id="format-help" className="form-text">
                エクスポートするファイル形式を選択してください
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="export-type" className="form-label">
                エクスポート対象 <span className="text-danger">*</span>
              </label>
              <select
                id="export-type"
                className="form-select"
                value={options.type}
                onChange={(e) => setOptions(prev => ({ ...prev, type: e.target.value as ExportType }))}
                disabled={isExporting}
                aria-describedby="type-help"
                required
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div id="type-help" className="form-text">
                エクスポートするデータの種類を選択してください
              </div>
            </div>

            {options.type === 'reservations' && (
              <fieldset className="mb-4">
                <legend className="form-label">期間指定（オプション）</legend>
                <div className="row">
                  <div className="col-md-6">
                    <label htmlFor="date-start" className="form-label">
                      開始日
                    </label>
                    <input
                      type="date"
                      id="date-start"
                      className="form-control"
                      value={options.dateRange?.start || ''}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: e.target.value,
                          end: prev.dateRange?.end || ''
                        }
                      }))}
                      disabled={isExporting}
                      aria-describedby="date-start-help"
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="date-end" className="form-label">
                      終了日
                    </label>
                    <input
                      type="date"
                      id="date-end"
                      className="form-control"
                      value={options.dateRange?.end || ''}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: prev.dateRange?.start || '',
                          end: e.target.value
                        }
                      }))}
                      disabled={isExporting}
                      aria-describedby="date-end-help"
                    />
                  </div>
                </div>
                <div id="date-start-help" className="form-text">
                  期間を指定する場合は開始日と終了日を両方入力してください
                </div>
              </fieldset>
            )}

            <div className="mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  id="include-deleted"
                  className="form-check-input"
                  checked={options.includeDeleted}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeDeleted: e.target.checked }))}
                  disabled={isExporting}
                  aria-describedby="deleted-help"
                />
                <label htmlFor="include-deleted" className="form-check-label">
                  削除済みデータを含める
                </label>
              </div>
              <div id="deleted-help" className="form-text">
                削除済みのデータもエクスポートに含める場合はチェックしてください
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isExporting}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting}
            aria-describedby="export-modal-description"
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート開始'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

/**
 * 自動エクスポート設定コンポーネント
 */
export interface AutoExportSettings {
  enabled: boolean
  schedule: 'daily' | 'weekly' | 'monthly'
  format: ExportFormat
  types: ExportType[]
  email?: string
}

export interface AutoExportConfigProps {
  settings: AutoExportSettings
  onSettingsChange: (settings: AutoExportSettings) => void
  className?: string
}

export const AutoExportConfig: React.FC<AutoExportConfigProps> = ({
  settings,
  onSettingsChange,
  className = ''
}) => {
  const scheduleLabels = {
    daily: '毎日',
    weekly: '毎週',
    monthly: '毎月'
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h5 className="card-title mb-0">自動エクスポート設定</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="form-check form-switch">
            <input
              type="checkbox"
              id="auto-export-enabled"
              className="form-check-input"
              checked={settings.enabled}
              onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
              aria-describedby="auto-export-help"
            />
            <label htmlFor="auto-export-enabled" className="form-check-label">
              自動エクスポートを有効にする
            </label>
          </div>
          <div id="auto-export-help" className="form-text">
            定期的に自動でデータをエクスポートします
          </div>
        </div>

        {settings.enabled && (
          <>
            <div className="mb-3">
              <label htmlFor="export-schedule" className="form-label">
                エクスポート頻度
              </label>
              <select
                id="export-schedule"
                className="form-select"
                value={settings.schedule}
                onChange={(e) => onSettingsChange({ ...settings, schedule: e.target.value as AutoExportSettings['schedule'] })}
                aria-describedby="schedule-help"
              >
                {Object.entries(scheduleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div id="schedule-help" className="form-text">
                エクスポートの実行頻度を選択してください
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="auto-export-format" className="form-label">
                エクスポート形式
              </label>
              <select
                id="auto-export-format"
                className="form-select"
                value={settings.format}
                onChange={(e) => onSettingsChange({ ...settings, format: e.target.value as ExportFormat })}
              >
                {Object.entries(formatLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">エクスポート対象</label>
              <div className="form-check-group">
                {Object.entries(typeLabels).map(([value, label]) => (
                  <div key={value} className="form-check">
                    <input
                      type="checkbox"
                      id={`auto-export-${value}`}
                      className="form-check-input"
                      checked={settings.types.includes(value as ExportType)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...settings.types, value as ExportType]
                          : settings.types.filter(t => t !== value)
                        onSettingsChange({ ...settings, types })
                      }}
                    />
                    <label htmlFor={`auto-export-${value}`} className="form-check-label">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="export-email" className="form-label">
                通知メールアドレス（オプション）
              </label>
              <input
                type="email"
                id="export-email"
                className="form-control"
                value={settings.email || ''}
                onChange={(e) => onSettingsChange({ ...settings, email: e.target.value })}
                placeholder="admin@example.com"
                aria-describedby="email-help"
              />
              <div id="email-help" className="form-text">
                エクスポート完了時に通知メールを送信するアドレスを入力してください
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DataExport