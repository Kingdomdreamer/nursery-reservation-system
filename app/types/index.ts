// 共通の型定義

export interface ProductItem {
  productId: string
  quantity: number
  pickupDate: string
}

export interface Product {
  id: string
  name: string
  price: number
}

export interface PersonalInfo {
  name: string
  furigana: string
  phone: string
  zipcode: string
  prefecture: string
  city: string
  town?: string
  addressDetail: string
  gender: 'male' | 'female' | 'other'
  birthDate: string
}

export interface ReservationData extends PersonalInfo {
  products: ProductItem[]
  comment?: string
}