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
  unit?: string
  min_order_quantity?: number
  max_order_quantity?: number
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
  // データベース制約チェック用ユーティリティ
  static async checkDatabaseConstraints(): Promise<void> {
    try {
      console.log('🔍 データベース制約をチェック中...')
      
      // 既存の商品データを確認
      const { data: existingProducts, error } = await supabase
        .from('products')
        .select('id, name, barcode')
        .limit(5)
      
      if (error) {
        console.error('制約チェックエラー:', error)
        return
      }
      
      console.log('📊 既存商品データ (先頭5件):', existingProducts)
      
      // 重複チェック
      const names = existingProducts?.map(p => p.name) || []
      const barcodes = existingProducts?.filter(p => p.barcode).map(p => p.barcode) || []
      
      console.log('📝 既存商品名:', names)
      console.log('🏷️ 既存バーコード:', barcodes)
      
    } catch (error) {
      console.error('制約チェック中にエラー:', error)
    }
  }
  static async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getActiveProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createProduct(productData: ProductCreateData) {
    try {
      console.log('🚀 商品作成開始:', productData)
      
      // バーコードの正規化（空文字列をnullに変換）
      const normalizedBarcode = productData.barcode?.trim() || null
      console.log('📊 正規化されたバーコード:', normalizedBarcode)
      
      // バーコードの重複チェック（バーコードが指定されている場合）
      if (normalizedBarcode) {
        console.log('🔍 バーコード重複チェック開始:', normalizedBarcode)
        const { data: existingProduct, error: checkError } = await supabase
          .from('products')
          .select('id, name, barcode')
          .eq('barcode', normalizedBarcode)
          .single()
        
        console.log('🔍 重複チェック結果:', { existingProduct, checkError })
        
        if (existingProduct) {
          throw new Error(`このバーコード「${normalizedBarcode}」は既に商品「${existingProduct.name}」で使用されています。別のバーコードを使用してください。`)
        }
      }
      
      // 同名商品の存在チェック
      console.log('🔍 同名商品チェック開始:', productData.name)
      const { data: existingNameProduct, error: nameCheckError } = await supabase
        .from('products')
        .select('id, name')
        .eq('name', productData.name)
        .single()
      
      console.log('🔍 同名チェック結果:', { existingNameProduct, nameCheckError })
      
      if (existingNameProduct) {
        throw new Error(`商品名「${productData.name}」は既に登録されています。別の商品名を使用してください。`)
      }
      
      // 挿入データの準備（IDフィールドを明示的に除外）
      const insertData = {
        name: productData.name?.trim(),
        description: productData.description?.trim() || null,
        price: Number(productData.price) || 0,
        category_id: productData.category_id?.trim() || null,
        unit: productData.unit?.trim() || null,
        min_order_quantity: Number(productData.min_order_quantity) || 1,
        max_order_quantity: productData.max_order_quantity ? Number(productData.max_order_quantity) : null,
        variation_name: productData.variation_name?.trim() || null,
        image_url: productData.image_url?.trim() || null,
        barcode: normalizedBarcode,
        tax_type: productData.tax_type || 'inclusive',
        is_available: productData.is_available !== false,
        display_order: productData.display_order || 0
        // 注意: idフィールドは意図的に含めない（自動生成のため）
      }
      
      console.log('📤 挿入予定データ:', insertData)
      
      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('💥 商品作成エラー（詳細）:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          full_error: JSON.stringify(error, null, 2)
        })
        
        // PostgreSQL unique violation (23505) の詳細分析
        if (error.code === '23505') {
          const detail = error.details || error.message || ''
          console.error('🔍 UNIQUE制約違反の詳細:', detail)
          
          if (detail.includes('barcode')) {
            throw new Error('このバーコードは既に登録されています。別のバーコードを使用してください。')
          } else if (detail.includes('name')) {
            throw new Error('この商品名は既に登録されています。別の商品名を使用してください。')
          } else if (detail.includes('pkey') || detail.includes('Primary key')) {
            throw new Error('内部エラー: 商品IDの重複が発生しました。再度お試しください。')
          } else {
            throw new Error(`重複エラー: ${detail}`)
          }
        }
        
        // その他のPostgreSQLエラー
        if (error.code?.startsWith('23')) {
          const constraintMap: Record<string, string> = {
            '23502': '必須フィールドが入力されていません',
            '23503': '関連データが存在しません（カテゴリIDなど）',
            '23514': '入力値が制約に違反しています'
          }
          const errorMsg = constraintMap[error.code] || '制約違反エラーが発生しました'
          throw new Error(`${errorMsg}: ${error.message}`)
        }
        
        throw error
      }
      
      return data
    } catch (error) {
      console.error('商品作成に失敗しました:', error)
      throw error
    }
  }

  static async updateProduct(id: string, productData: Partial<ProductCreateData>) {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...productData,
        category_id: productData.category_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
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
      // 改行コードを正規化
      const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const lines = normalizedText.trim().split('\n').filter(line => line.trim())
      
      console.log('CSV解析開始:', {
        totalLines: lines.length,
        firstLine: lines[0]?.substring(0, 100) + (lines[0]?.length > 100 ? '...' : ''),
        encoding: 'UTF-8'
      })
      
      if (lines.length < 2) {
        throw new Error('CSVファイルが空か、ヘッダー行しかありません。最低でもヘッダー行とデータ行が必要です。')
      }

      // ヘッダー行の解析
      const headerLine = lines[0].trim()
      if (!headerLine) {
        throw new Error('ヘッダー行が空です')
      }
      
      const headers = this.parseCSVLine(headerLine).map(h => h.trim().replace(/^["']|["']$/g, ''))
      console.log('検出されたヘッダー:', headers)
      
      if (headers.length === 0) {
        throw new Error('ヘッダー行を解析できませんでした')
      }
      
      const data: CSVProduct[] = []
      const errors: string[] = []

      // 必要なヘッダーのチェック
      const requiredHeaders = ['name']
      const headerLowerCase = headers.map(h => h.toLowerCase())
      const missingHeaders = requiredHeaders.filter(req => 
        !headerLowerCase.includes(req.toLowerCase())
      )
      
      if (missingHeaders.length > 0) {
        throw new Error(`必須の列が見つかりません: ${missingHeaders.join(', ')}\n\n検出された列: ${headers.join(', ')}\n\n列名は大文字小文字を区別しません。`)
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) {
          console.log(`行${i + 1}: 空行をスキップ`)
          continue // 空行をスキップ
        }

        try {
          // より正確なCSVパース（カンマ区切りだが引用符内のカンマは無視）
          const values = this.parseCSVLine(line)
          console.log(`行${i + 1} 解析:`, { line: line.substring(0, 50) + '...', values })
          
          if (values.length !== headers.length) {
            console.warn(`行${i + 1}: 列数が一致しません（期待: ${headers.length}, 実際: ${values.length}）`)
          }
          
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
                  const price = parseFloat(value.replace(/[￥,]/g, '')) // 円マークやカンマを除去
                  if (isNaN(price) || price < 0) {
                    errors.push(`行${i + 1}: 価格「${value}」が無効です（数値または0以上の値を入力してください）`)
                  } else {
                    product.price = price
                  }
                }
                break
              case 'variation_name':
                if (value) product.variation_name = value
                break
              case 'tax_type':
                if (value) {
                  // 日本語の税区分を英語に変換
                  const normalizedValue = value.toLowerCase().trim()
                  if (normalizedValue === '内税' || normalizedValue === 'inclusive') {
                    product.tax_type = 'inclusive'
                  } else if (normalizedValue === '外税' || normalizedValue === 'exclusive') {
                    product.tax_type = 'exclusive'
                  } else if (!['inclusive', 'exclusive'].includes(normalizedValue)) {
                    errors.push(`行${i + 1}: 税区分「${value}」が無効です（内税/外税 または inclusive/exclusiveのみ）`)
                  } else {
                    product.tax_type = normalizedValue
                  }
                }
                break
              case 'category_id':
                if (value) product.category_id = value
                break
              case 'description':
                if (value) product.description = value
                break
              default:
                // 不明な列は無視（警告のみ）
                if (value) {
                  console.warn(`行${i + 1}: 未知の列「${header}」を無視しました`)
                }
                break
            }
          })

          if (!hasError && product.name) {
            data.push(product)
            console.log(`行${i + 1}: 商品「${product.name}」を追加`)
          }
        } catch (lineError: any) {
          errors.push(`行${i + 1}: 行の解析に失敗しました - ${lineError.message}`)
        }
      }

      if (errors.length > 0) {
        const errorSummary = `CSVファイルに${errors.length}個のエラーがあります:\n\n${errors.join('\n')}`
        console.error('CSV解析エラー詳細:', errors)
        throw new Error(errorSummary)
      }

      if (data.length === 0) {
        throw new Error('有効な商品データが見つかりませんでした。\n\n以下を確認してください:\n• name列に値が入力されているか\n• データ行が存在するか\n• ファイル形式が正しいか')
      }

      console.log(`CSV解析完了: ${data.length}件のデータを正常に解析しました`)
      return data
    } catch (error: any) {
      const detailedError = error.message || '不明なエラーが発生しました'
      console.error('CSV解析エラー:', error)
      throw new Error(`CSV解析エラー: ${detailedError}`)
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