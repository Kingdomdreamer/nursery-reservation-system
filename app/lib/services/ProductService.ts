import { supabase, Product, ProductCategory } from '../../../lib/supabase'

export interface ProductCreateData {
  name: string
  category_id?: string
  description?: string
  price: number
  barcode?: string
  variation_name?: string
  tax_type?: string
  image_url?: string
  is_available?: boolean
  display_order?: number
}

export interface ProductUpdateData extends Partial<ProductCreateData> {
  id: string
}

export interface CSVProduct {
  id?: string
  name: string
  barcode?: string
  price?: number
  variation_name?: string
  tax_type?: string
  category_id?: string
  description?: string
}

export class ProductService {
  static async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getActiveProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          color
        )
      `)
      .eq('is_available', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          color
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async createProduct(productData: ProductCreateData) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        category_id: productData.category_id || null,
        tax_type: productData.tax_type || 'inclusive',
        is_available: productData.is_available !== false,
        display_order: productData.display_order || 0
      }])
      .select()

    if (error) throw error
    return data[0]
  }

  static async updateProduct(id: string, productData: Partial<ProductCreateData>) {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        category_id: productData.category_id || null
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  }

  static async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  static async getAllCategories() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async bulkImportProducts(products: CSVProduct[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // バリデーション
    const validatedProducts = []
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const lineNumber = i + 2 // CSVヘッダー行を考慮

      // 必須項目チェック
      if (!product.name || product.name.trim() === '') {
        results.failed++
        results.errors.push(`行${lineNumber}: 商品名が入力されていません`)
        continue
      }

      // データ型チェック
      if (product.price !== undefined && (isNaN(Number(product.price)) || Number(product.price) < 0)) {
        results.warnings.push(`行${lineNumber}: 価格が無効です。0に設定されます`)
        product.price = 0
      }

      // 商品名の重複チェック（新規商品の場合）
      if (!product.id) {
        const existingProduct = await this.getProductByName(product.name.trim())
        if (existingProduct) {
          results.warnings.push(`行${lineNumber}: 商品「${product.name}」は既に存在します`)
        }
      }

      validatedProducts.push({ ...product, lineNumber })
    }

    // 実際のインポート処理
    for (const product of validatedProducts) {
      try {
        if (product.id) {
          // 既存商品の更新
          const existingProduct = await this.getProductById(product.id)
          if (!existingProduct) {
            results.failed++
            results.errors.push(`行${product.lineNumber}: ID「${product.id}」の商品が見つかりません`)
            continue
          }

          await this.updateProduct(product.id, {
            name: product.name.trim(),
            barcode: product.barcode?.trim() || undefined,
            price: product.price || 0,
            variation_name: product.variation_name?.trim() || undefined,
            tax_type: product.tax_type || 'inclusive',
            category_id: product.category_id || undefined,
            description: product.description?.trim() || undefined
          })
        } else {
          // 新規商品の追加
          await this.createProduct({
            name: product.name.trim(),
            barcode: product.barcode?.trim() || undefined,
            price: product.price || 0,
            variation_name: product.variation_name?.trim() || undefined,
            tax_type: product.tax_type || 'inclusive',
            category_id: product.category_id || undefined,
            description: product.description?.trim() || undefined,
            is_available: true,
            display_order: 0
          })
        }
        results.success++
      } catch (error: any) {
        results.failed++
        const errorMessage = error?.message || error?.toString() || '不明なエラー'
        results.errors.push(`行${product.lineNumber}: 商品「${product.name}」: ${errorMessage}`)
      }
    }

    return results
  }

  static async getProductByName(name: string) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('name', name)
      .limit(1)

    if (error) throw error
    return data?.[0] || null
  }

  static async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw error
    return data?.[0] || null
  }

  static parseCSV(csvText: string): CSVProduct[] {
    try {
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) {
        throw new Error('CSVファイルが空か、ヘッダー行しかありません')
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
      const data: CSVProduct[] = []
      const errors: string[] = []

      // 必要なヘッダーのチェック
      const requiredHeaders = ['name']
      const missingHeaders = requiredHeaders.filter(req => 
        !headers.some(h => h.toLowerCase() === req.toLowerCase())
      )
      
      if (missingHeaders.length > 0) {
        throw new Error(`必須の列が見つかりません: ${missingHeaders.join(', ')}`)
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue // 空行をスキップ

        // より正確なCSVパース（カンマ区切りだが引用符内のカンマは無視）
        const values = this.parseCSVLine(line)
        const product: any = {}
        let hasError = false

        headers.forEach((header, index) => {
          const value = values[index]?.trim().replace(/^["']|["']$/g, '') || ''
          
          switch (header.toLowerCase()) {
            case 'id':
              if (value) product.id = value
              break
            case 'name':
              if (value) {
                product.name = value
              } else {
                errors.push(`行${i + 1}: 商品名が入力されていません`)
                hasError = true
              }
              break
            case 'barcode':
              if (value) product.barcode = value
              break
            case 'price':
              if (value) {
                const price = parseFloat(value)
                if (isNaN(price) || price < 0) {
                  errors.push(`行${i + 1}: 価格「${value}」が無効です`)
                } else {
                  product.price = price
                }
              }
              break
            case 'variation_name':
              if (value) product.variation_name = value
              break
            case 'tax_type':
              if (value && !['inclusive', 'exclusive'].includes(value.toLowerCase())) {
                errors.push(`行${i + 1}: 税区分「${value}」が無効です（inclusive/exclusiveのみ）`)
              } else if (value) {
                product.tax_type = value.toLowerCase()
              }
              break
            case 'category_id':
              if (value) product.category_id = value
              break
            case 'description':
              if (value) product.description = value
              break
          }
        })

        if (!hasError && product.name) {
          data.push(product)
        }
      }

      if (errors.length > 0) {
        throw new Error(`CSVに以下のエラーがあります:\n${errors.join('\n')}`)
      }

      if (data.length === 0) {
        throw new Error('有効な商品データが見つかりませんでした')
      }

      return data
    } catch (error: any) {
      throw new Error(`CSV解析エラー: ${error.message}`)
    }
  }

  static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char
          i++ // エスケープされた引用符をスキップ
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  static generateCSVTemplate(categories: ProductCategory[]): string {
    const headers = [
      'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
      'category_id', 'description'
    ]
    
    const sampleData = [
      '', 'トマト苗', '4901234567890', '300', '通常価格', 'inclusive',
      categories[0]?.id || '', '中玉トマトの苗'
    ]

    return headers.join(',') + '\n' + sampleData.join(',')
  }

  static async exportToCSV(): Promise<string> {
    const products = await this.getAllProducts()

    const headers = [
      'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
      'category_id', 'description'
    ]

    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name}"`,
        product.barcode || '',
        product.price,
        product.variation_name || '',
        product.tax_type || '',
        product.category_id || '',
        `"${product.description || ''}"`
      ].join(','))
    ].join('\n')

    return csvContent
  }
}