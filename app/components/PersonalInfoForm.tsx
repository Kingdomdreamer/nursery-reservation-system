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
    <div className="space-y-6">
      <h3 className="section-title">お客様情報</h3>
      
      <div className="form-group">
        <label className="form-label">名前 <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          className="form-input"
          placeholder="山田 太郎"
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">フリガナ <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formData.furigana}
          onChange={handleInputChange('furigana')}
          className="form-input"
          placeholder="ヤマダ タロウ"
        />
        {errors.furigana && <p className="form-error">{errors.furigana}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">電話番号 <span className="text-red-500">*</span></label>
        <input
          type="tel"
          value={formData.phone}
          onChange={handleInputChange('phone')}
          className="form-input"
          placeholder="090-1234-5678"
        />
        {errors.phone && <p className="form-error">{errors.phone}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">
          郵便番号
          {isZipcodeLoading && <span className="text-sm text-blue-600 ml-2">住所を検索中...</span>}
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={formData.zipcode}
            onChange={handleZipcodeChange}
            onKeyDown={handleZipcodeKeyDown}
            className="form-input"
            placeholder="例: 123-4567"
            maxLength={8}
            style={{ flex: '1' }}
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7}
            title={getSearchButtonTooltip()}
            className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isZipcodeLoading || formData.zipcode.replace(/[^0-9]/g, '').length !== 7
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            style={{ minHeight: '48px', whiteSpace: 'nowrap' }}
          >
            {isZipcodeLoading ? '検索中...' : '住所検索'}
          </button>
          {autoFilledFields.size > 0 && (
            <button
              type="button"
              onClick={clearAutoFill}
              className="px-3 py-3 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              style={{ minHeight: '48px', whiteSpace: 'nowrap' }}
            >
              クリア
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1 space-y-1">
          <p>📍 郵便番号を7桁入力後、「住所検索」ボタンをタップで住所が自動入力されます</p>
          <p>🔒 都道府県・市区町村は自動入力、町名以降は編集できます</p>
          <p>🌏 全国の郵便番号に対応しています</p>
        </div>
        {errors.zipcode && <p className="form-error">{errors.zipcode}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">
            都道府県
            {autoFilledFields.has('prefecture') && (
              <span className="text-xs text-gray-500 ml-2">(自動入力)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.prefecture}
            onChange={handleInputChange('prefecture')}
            className={getInputClassName('prefecture')}
            placeholder="東京都"
            readOnly={isFieldReadOnly('prefecture')}
            style={{ backgroundColor: isFieldReadOnly('prefecture') ? '#f3f4f6' : '' }}
          />
          {errors.prefecture && <p className="form-error">{errors.prefecture}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">
            市区町村
            {autoFilledFields.has('city') && (
              <span className="text-xs text-gray-500 ml-2">(自動入力)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={handleInputChange('city')}
            className={getInputClassName('city')}
            placeholder="渋谷区"
            readOnly={isFieldReadOnly('city')}
            style={{ backgroundColor: isFieldReadOnly('city') ? '#f3f4f6' : '' }}
          />
          {errors.city && <p className="form-error">{errors.city}</p>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          町名
          {autoFilledFields.has('town') && (
            <span className="text-xs text-gray-500 ml-2">(自動入力されました)</span>
          )}
        </label>
        <input
          type="text"
          value={formData.town || ''}
          onChange={handleInputChange('town')}
          className="form-input"
          placeholder="神南"
        />
        <p className="text-sm text-gray-600 mt-1">町名以降の項目は編集可能です</p>
      </div>

      <div className="form-group">
        <label className="form-label">番地・建物名・部屋番号</label>
        <input
          type="text"
          value={formData.addressDetail}
          onChange={handleInputChange('addressDetail')}
          className="form-input"
          placeholder="1-2-3 サンプルマンション101号室"
        />
        <p className="text-sm text-gray-600 mt-1">こちらは常に編集可能です</p>
        {errors.addressDetail && <p className="form-error">{errors.addressDetail}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">性別</label>
          <select 
            value={formData.gender}
            onChange={handleInputChange('gender')}
            className="form-select"
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
          {errors.gender && <p className="form-error">{errors.gender}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">生年月日</label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={handleInputChange('birthDate')}
            className="form-input"
          />
          {errors.birthDate && <p className="form-error">{errors.birthDate}</p>}
        </div>
      </div>
    </div>
  )
}