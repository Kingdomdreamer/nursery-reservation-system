'use client'

import React, { useState } from 'react'
import { PersonalInfo } from '../types'

interface Props {
  formData: PersonalInfo
  setFormData: (data: PersonalInfo) => void
  errors: any
}

// zipcloud API用のインターフェース
interface ZipcloudResult {
  message: string | null
  results: Array<{
    address1: string    // 都道府県
    address2: string    // 市区町村
    address3: string    // 町名
    kana1: string      // 都道府県カナ
    kana2: string      // 市区町村カナ
    kana3: string      // 町名カナ
    prefcode: string   // 都道府県コード
    zipcode: string    // 郵便番号
  }> | null
  status: number
}

export default function PersonalInfoForm({ formData, setFormData, errors }: Props) {
  const [isZipcodeLoading, setIsZipcodeLoading] = useState(false)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())

  const handleInputChange = (field: keyof PersonalInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  const formatZipcode = (value: string): string => {
    // 数字のみを抽出
    const numbers = value.replace(/[^0-9]/g, '')
    
    // 7桁の場合は自動でハイフンを挿入
    if (numbers.length === 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 3) {
      return numbers
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`
    }
  }

  const searchAddressByZipcode = async (zipcode: string): Promise<boolean> => {
    setIsZipcodeLoading(true)
    
    try {
      // 郵便番号を正規化（ハイフンを除去）
      const normalizedZipcode = zipcode.replace(/[^0-9]/g, '')
      
      if (normalizedZipcode.length !== 7) {
        return false
      }
      
      // zipcloud APIで住所情報を取得
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedZipcode}`)
      
      if (!response.ok) {
        throw new Error(`APIリクエストエラー: ${response.status}`)
      }
      
      const data: ZipcloudResult = await response.json()
      
      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0]
        
        // 住所情報を自動入力
        setFormData({
          ...formData,
          zipcode,
          prefecture: result.address1,
          city: result.address2,
          town: result.address3
        })
        
        // 自動入力されたフィールドを記録（町名以降は編集可能）
        setAutoFilledFields(new Set(['prefecture', 'city', 'town']))
        
        return true
      } else {
        // 住所が見つからない場合
        return false
      }
    } catch (error) {
      console.error('住所検索エラー:', error)
      return false
    } finally {
      setIsZipcodeLoading(false)
    }
  }

  const handleZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const formattedZipcode = formatZipcode(rawValue)
    
    // 郵便番号フィールドを更新
    setFormData({ ...formData, zipcode: formattedZipcode })
    
    // 郵便番号が不完全な場合は自動入力をクリア
    const numbers = formattedZipcode.replace(/[^0-9]/g, '')
    if (numbers.length < 7 && autoFilledFields.size > 0) {
      setFormData({
        ...formData,
        zipcode: formattedZipcode,
        prefecture: '',
        city: '',
        town: ''
      })
      setAutoFilledFields(new Set())
    }
  }

  const handleZipcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const numbers = formData.zipcode.replace(/[^0-9]/g, '')
      if (numbers.length === 7 && !isZipcodeLoading) {
        handleAddressSearch()
      }
    }
  }

  const handleAddressSearch = async () => {
    const numbers = formData.zipcode.replace(/[^0-9]/g, '')
    
    if (numbers.length !== 7) {
      alert('郵便番号は7桁で入力してください（例: 123-4567）')
      return
    }

    const found = await searchAddressByZipcode(formData.zipcode)
    if (!found) {
      alert(`郵便番号「${formData.zipcode}」に該当する住所が見つかりませんでした。\n\n※ 全国の郵便番号に対応していますが、存在しない郵便番号や形式が正しくない場合は検索できません。`)
      setAutoFilledFields(new Set())
    }
  }

  const getSearchButtonTooltip = () => {
    const numbers = formData.zipcode.replace(/[^0-9]/g, '')
    if (numbers.length === 0) {
      return '郵便番号を入力してください'
    } else if (numbers.length < 7) {
      return `あと${7 - numbers.length}桁入力してください`
    } else if (numbers.length === 7) {
      return 'タップして住所を検索'
    }
    return ''
  }

  const clearAutoFill = () => {
    setFormData({
      ...formData,
      prefecture: '',
      city: '',
      town: ''
    })
    setAutoFilledFields(new Set())
  }

  const getInputClassName = (fieldName: string) => {
    if (autoFilledFields.has(fieldName) && (fieldName === 'prefecture' || fieldName === 'city')) {
      return 'form-input-auto-filled'
    }
    return 'form-input'
  }

  const isFieldReadOnly = (fieldName: string) => {
    // 都道府県と市区町村のみ読み取り専用
    return autoFilledFields.has(fieldName) && (fieldName === 'prefecture' || fieldName === 'city')
  }

  return (
    <div className="form-mailer-section">
      <div className="form-mailer-info">
        お客様の基本情報をご入力ください。必須項目は<span className="form-mailer-required">*</span>マークでご確認いただけます。
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">
          お名前<span className="form-mailer-required">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          className="form-mailer-input"
          placeholder="山田 太郎"
        />
        {errors.name && <span className="form-mailer-error">{errors.name}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">
          フリガナ<span className="form-mailer-required">*</span>
        </label>
        <input
          type="text"
          value={formData.furigana}
          onChange={handleInputChange('furigana')}
          className="form-mailer-input"
          placeholder="ヤマダ タロウ"
        />
        {errors.furigana && <span className="form-mailer-error">{errors.furigana}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">
          電話番号<span className="form-mailer-required">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          className="form-mailer-input"
          placeholder="090-1234-5678"
        />
        {errors.phone && <span className="form-mailer-error">{errors.phone}</span>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">
          郵便番号
          {isZipcodeLoading && <span style={{ fontSize: '12px', color: '#666666', marginLeft: '8px' }}>住所を検索中...</span>}
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <input
            type="text"
            value={formData.zipcode}
            onChange={handleZipcodeChange}
            onKeyDown={handleZipcodeKeyDown}
            className="form-mailer-input"
            placeholder="例: 123-4567"
            maxLength={8}
            style={{ flex: '1' }}
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7}
            title={getSearchButtonTooltip()}
            className={isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7 
              ? 'form-mailer-button-secondary' 
              : 'form-mailer-button'}
            style={{ 
              width: 'auto', 
              padding: '12px 16px', 
              margin: '0',
              fontSize: '14px',
              backgroundColor: isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7 
                ? '#cccccc' : '#333333',
              cursor: isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7 
                ? 'not-allowed' : 'pointer'
            }}
          >
            {isZipcodeLoading ? '検索中...' : '住所検索'}
          </button>
          {autoFilledFields.size > 0 && (
            <button
              type="button"
              onClick={clearAutoFill}
              className="form-mailer-button-secondary"
              style={{ 
                width: 'auto', 
                padding: '12px 16px', 
                margin: '0',
                fontSize: '14px'
              }}
            >
              クリア
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
          郵便番号を7桁入力後、「住所検索」ボタンで住所が自動入力されます。全国の郵便番号に対応しています。
        </div>
        {errors.zipcode && <span className="form-mailer-error">{errors.zipcode}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label className="form-mailer-label">
            都道府県
            {autoFilledFields.has('prefecture') && (
              <span style={{ fontSize: '11px', color: '#999999', marginLeft: '4px' }}>(自動入力)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.prefecture}
            onChange={handleInputChange('prefecture')}
            className="form-mailer-input"
            placeholder="東京都"
            readOnly={isFieldReadOnly('prefecture')}
            style={{ backgroundColor: isFieldReadOnly('prefecture') ? '#f5f5f5' : '#ffffff' }}
          />
          {errors.prefecture && <span className="form-mailer-error">{errors.prefecture}</span>}
        </div>

        <div>
          <label className="form-mailer-label">
            市区町村
            {autoFilledFields.has('city') && (
              <span style={{ fontSize: '11px', color: '#999999', marginLeft: '4px' }}>(自動入力)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={handleInputChange('city')}
            className="form-mailer-input"
            placeholder="渋谷区"
            readOnly={isFieldReadOnly('city')}
            style={{ backgroundColor: isFieldReadOnly('city') ? '#f5f5f5' : '#ffffff' }}
          />
          {errors.city && <span className="form-mailer-error">{errors.city}</span>}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">
          町名
          {autoFilledFields.has('town') && (
            <span style={{ fontSize: '11px', color: '#999999', marginLeft: '4px' }}>(自動入力されました)</span>
          )}
        </label>
        <input
          type="text"
          value={formData.town || ''}
          onChange={handleInputChange('town')}
          className="form-mailer-input"
          placeholder="神南"
        />
        <div style={{ fontSize: '12px', color: '#666666', marginTop: '4px' }}>
          町名以降の項目は編集可能です
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label className="form-mailer-label">番地・建物名・部屋番号</label>
        <input
          type="text"
          value={formData.addressDetail}
          onChange={handleInputChange('addressDetail')}
          className="form-mailer-input"
          placeholder="1-2-3 サンプルマンション101号室"
        />
        {errors.addressDetail && <span className="form-mailer-error">{errors.addressDetail}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label className="form-mailer-label">性別</label>
          <select 
            value={formData.gender}
            onChange={handleInputChange('gender')}
            className="form-mailer-select"
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
          {errors.gender && <span className="form-mailer-error">{errors.gender}</span>}
        </div>

        <div>
          <label className="form-mailer-label">生年月日</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={handleInputChange('birthDate')}
            className="form-mailer-input"
          />
          {errors.birthDate && <span className="form-mailer-error">{errors.birthDate}</span>}
        </div>
      </div>
    </div>
  )
}