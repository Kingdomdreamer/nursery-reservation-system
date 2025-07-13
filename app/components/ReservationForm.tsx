'use client'

import { useState } from 'react'
import PersonalInfoForm from './PersonalInfoForm'
import ProductSelectionForm from './ProductSelectionForm'
import ConfirmationScreen from './ConfirmationScreen'
import CompletionScreen from './CompletionScreen'
import ManageScreen from './ManageScreen'
import { ReservationData, PersonalInfo, ProductItem } from '../types'

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

export default function ReservationForm() {
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
    <div className="form-container">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">予約情報入力</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <PersonalInfoForm 
          formData={personalInfo}
          setFormData={setPersonalInfo}
          errors={errors}
        />
        
        <ProductSelectionForm
          productItems={productItems}
          setProductItems={setProductItems}
          availableProducts={availableProducts}
          errors={errors}
        />

        <div className="form-group">
          <label className="form-label">店舗へのコメント</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="form-input"
            rows={4}
            placeholder="ご要望やご質問がございましたらご記入ください（500文字以内）"
          />
          {errors.comment && <p className="form-error">{errors.comment}</p>}
        </div>

        <button type="submit" className="btn-primary">
          入力内容を確認する
        </button>
      </form>
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
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      )
    case 'complete':
      return (
        <CompletionScreen
          onManage={() => setCurrentStep('manage')}
          onNewReservation={handleReset}
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