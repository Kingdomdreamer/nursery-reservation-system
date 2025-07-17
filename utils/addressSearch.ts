// 住所検索用のユーティリティ関数

interface AddressResult {
  prefecture: string
  city: string
  address: string
}

interface PostalCodeApiResponse {
  results: Array<{
    address1: string
    address2: string
    address3: string
    kana1: string
    kana2: string
    kana3: string
    prefcode: string
    zipcode: string
  }>
}

export const searchAddressByPostalCode = async (postalCode: string): Promise<AddressResult | null> => {
  try {
    // 郵便番号のハイフンを除去
    const cleanedPostalCode = postalCode.replace(/-/g, '')
    
    // 郵便番号APIを呼び出し
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanedPostalCode}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch address data')
    }
    
    const data: PostalCodeApiResponse = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return null
    }
    
    const result = data.results[0]
    
    return {
      prefecture: result.address1,
      city: result.address2,
      address: result.address3
    }
  } catch (error) {
    console.error('Address search error:', error)
    return null
  }
}

export const formatPostalCode = (postalCode: string): string => {
  // 数字のみを抽出
  const numbers = postalCode.replace(/[^0-9]/g, '')
  
  // 7桁でない場合はそのまま返す
  if (numbers.length !== 7) {
    return postalCode
  }
  
  // XXX-XXXX形式でフォーマット
  return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
}

export const validatePostalCode = (postalCode: string): boolean => {
  // 数字のみを抽出
  const numbers = postalCode.replace(/[^0-9]/g, '')
  
  // 7桁の数字であるかチェック
  return numbers.length === 7 && /^\d{7}$/.test(numbers)
}

export default {
  searchAddressByPostalCode,
  formatPostalCode,
  validatePostalCode
}