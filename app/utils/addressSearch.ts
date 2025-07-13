export interface AddressData {
  prefecture: string
  city: string
  town: string
  fullAddress: string
}

export async function searchAddressByZipcode(zipcode: string): Promise<AddressData | null> {
  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`)
    const data = await response.json()
    
    if (data.status === 200 && data.results && data.results.length > 0) {
      const result = data.results[0]
      return {
        prefecture: result.address1,
        city: result.address2,
        town: result.address3,
        fullAddress: `${result.address1}${result.address2}${result.address3}`
      }
    }
    return null
  } catch (error) {
    console.error('住所検索エラー:', error)
    return null
  }
}

export function formatZipcode(value: string): string {
  const numbers = value.replace(/[^0-9]/g, '')
  if (numbers.length <= 3) {
    return numbers
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`
}

export function validateZipcode(zipcode: string): boolean {
  const pattern = /^\d{3}-?\d{4}$/
  return pattern.test(zipcode)
}