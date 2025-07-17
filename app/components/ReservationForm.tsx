'use client'

import { useState } from 'react'
import PersonalInfoForm from './PersonalInfoForm'
import ProductSelectionForm from './ProductSelectionForm'
import ConfirmationScreen from './ConfirmationScreen'
import CompletionScreen from './CompletionScreen'
import ManageScreen from './ManageScreen'
import { ReservationData, PersonalInfo, ProductItem } from '../types'
import { PricingDisplaySettings, LineAuthInfo } from '@/types/forms'

type Step = 'form' | 'confirm' | 'complete' | 'manage'

const availableProducts = [
  { id: 'tomato', name: 'トマトの苗', price: 200 },
  { id: 'cucumber', name: 'きゅうりの苗', price: 180 },
  { id: 'eggplant', name: 'なすの苗', price: 220 },
  { id: 'pepper', name: 'ピーマンの苗', price: 190 },
  { id: 'lettuce', name: 'レタスの種', price: 150 },
  { id: 'carrot', name: 'にんじんの種', price: 120 },
  { id: 'radish', name: 'だいこんの種', price: 100 },
  { id: 'spinach', name: 'ほうれん草の種', price: 130 },
]

interface ReservationFormProps {
  pricingSettings?: PricingDisplaySettings
  lineAuthInfo?: LineAuthInfo
}

export default function ReservationForm({ 
  pricingSettings, 
  lineAuthInfo 
}: ReservationFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('form')
  const [reservationData, setReservationData] = useState<ReservationData | null>(null)
  const [productItems, setProductItems] = useState<ProductItem[]>([
    { productId: '', quantity: 1, pickupDate: '' }
  ])
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    furigana: '',
    phone: '',
    zipcode: '',
    prefecture: '',
    city: '',
    town: '',
    addressDetail: '',
    gender: 'male',
    birthDate: ''
  })
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<any>({})

  const validateForm = (): boolean => {
    const newErrors: any = {}
    
    if (!personalInfo.name) newErrors.name = '名前を入力してください'
    if (!personalInfo.phone) newErrors.phone = '電話番号を入力してください'
    if (productItems.length === 0 || productItems.every(item => !item.productId)) {
      newErrors.products = '最低1つの商品を選択してください'
    }
    
    // 引き取り日のチェック
    const today = new Date().toISOString().split('T')[0]
    const hasInvalidDate = productItems.some(item => item.pickupDate < today)
    if (hasInvalidDate) {
      newErrors.pickupDate = '引き取り日は今日以降の日付を選択してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const submissionData: ReservationData = { 
        ...personalInfo, 
        products: productItems,
        comment 
      }
      setReservationData(submissionData)
      setCurrentStep('confirm')
    }
  }

  const handleConfirm = () => {
    setCurrentStep('complete')
  }

  const handleEdit = () => {
    setCurrentStep('form')
  }

  const handleReset = () => {
    setPersonalInfo({
      name: '',
      furigana: '',
      phone: '',
      zipcode: '',
      prefecture: '',
      city: '',
      town: '',
      addressDetail: '',
      gender: 'male',
      birthDate: ''
    })
    setComment('')
    setReservationData(null)
    setProductItems([{ productId: '', quantity: 1, pickupDate: '' }])
    setErrors({})
    setCurrentStep('form')
  }

  const renderForm = () => (
    <div className="form-mailer-style">
      <div className="form-mailer-container">
        {/* プログレス表示 */}
        <div className="form-mailer-progress">
          <div className="form-mailer-step active">
            <div className="form-mailer-step-number">1</div>
            <span>入力</span>
          </div>
          <div className="form-mailer-step-arrow">→</div>
          <div className="form-mailer-step">
            <div className="form-mailer-step-number">2</div>
            <span>確認</span>
          </div>
          <div className="form-mailer-step-arrow">→</div>
          <div className="form-mailer-step">
            <div className="form-mailer-step-number">3</div>
            <span>完了</span>
          </div>
        </div>

        <h1 className="form-mailer-title">予約フォーム</h1>
        
        <form onSubmit={handleSubmit}>
          <PersonalInfoForm 
            formData={personalInfo}
            setFormData={setPersonalInfo}
            errors={errors}
          />
          
          <ProductSelectionForm
            productItems={productItems}
            setProductItems={setProductItems}
            availableProducts={availableProducts}
            pricingSettings={pricingSettings}
            errors={errors}
          />

          <div className="form-mailer-section">
            <label className="form-mailer-label">
              店舗へのコメント
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-mailer-textarea"
              rows={4}
              placeholder="ご要望やご質問がございましたらご記入ください（500文字以内）"
            />
            {errors.comment && <span className="form-mailer-error">{errors.comment}</span>}
          </div>

          <button type="submit" className="form-mailer-button">
            入力内容を確認する
          </button>
        </form>
      </div>
    </div>
  )

  switch (currentStep) {
    case 'form':
      return renderForm()
    case 'confirm':
      return (
        <ConfirmationScreen
          reservationData={reservationData!}
          availableProducts={availableProducts}
          pricingSettings={pricingSettings}
          lineAuthInfo={lineAuthInfo}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      )
    case 'complete':
      return (
        <CompletionScreen
          reservationData={reservationData || undefined}
          availableProducts={availableProducts}
          pricingSettings={pricingSettings}
          lineAuthInfo={lineAuthInfo}
          onManage={() => setCurrentStep('manage')}
          onNewReservation={handleReset}
          reservationId={`RES-${Date.now().toString()}`}
        />
      )
    case 'manage':
      return (
        <ManageScreen
          reservationData={reservationData}
          onBack={() => setCurrentStep('complete')}
        />
      )
    default:
      return renderForm()
  }
}