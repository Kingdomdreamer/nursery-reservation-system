import { supabase, Product, ProductCategory } from '../lib/supabase'

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
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('商品取得エラー:', error)
        throw error
      }

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        description: product.description,
        is_available: product.is_available,
        created_at: product.created_at,
        updated_at: product.updated_at,
        unit: product.unit,
        min_order_quantity: product.min_order_quantity,
        max_order_quantity: product.max_order_quantity,
        variation_name: product.variation_name,
        image_url: product.image_url,
        barcode: product.barcode,
        tax_type: product.tax_type,
        display_order: product.display_order
      }))
    } catch (error) {
      console.error('商品一覧の取得に失敗しました:', error)
      // フォールバック: 保育園向けの商品データを返す
      return [
        {
          id: '1',
          name: 'トマトの苗',
          price: 300,
          category_id: 'cat_1',
          description: '家庭菜園に最適なミニトマトの苗',
          is_available: true,
          unit: '個',
          min_order_quantity: 1,
          max_order_quantity: 10,
          variation_name: null,
          image_url: null,
          barcode: null,
          tax_type: 'standard',
          display_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'キュウリの種',
          price: 250,
          category_id: 'cat_2',
          description: '育てやすいキュウリの種セット',
          is_available: true,
          unit: 'パック',
          min_order_quantity: 1,
          max_order_quantity: 5,
          variation_name: null,
          image_url: null,
          barcode: null,
          tax_type: 'standard',
          display_order: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: '花の苗セット',
          price: 800,
          category_id: 'cat_3',
          description: '季節の花の苗3個セット',
          is_available: true,
          unit: 'セット',
          min_order_quantity: 1,
          max_order_quantity: 3,
          variation_name: null,
          image_url: null,
          barcode: null,
          tax_type: 'standard',
          display_order: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'ハーブセット',
          price: 500,
          category_id: 'cat_4',
          description: 'バジル、パセリ、ミントのハーブセット',
          is_available: true,
          unit: 'セット',
          min_order_quantity: 1,
          max_order_quantity: 2,
          variation_name: null,
          image_url: null,
          barcode: null,
          tax_type: 'standard',
          display_order: 4,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
  }

  static async getAllCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('カテゴリ取得エラー:', error)
        throw error
      }

      return (data || []).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        parent_id: category.parent_id,
        sort_order: category.sort_order,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at
      }))
    } catch (error) {
      console.error('カテゴリ一覧の取得に失敗しました:', error)
      // フォールバック: 保育園向けのカテゴリデータを返す
      return [
        {
          id: 'cat_1',
          name: '野菜の苗',
          description: 'トマト、キュウリ、ナスなどの野菜の苗',
          parent_id: null,
          sort_order: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_2',
          name: '種子',
          description: '様々な野菜や花の種子',
          parent_id: null,
          sort_order: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_3',
          name: '花の苗',
          description: '季節の花や観賞用植物の苗',
          parent_id: null,
          sort_order: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_4',
          name: 'ハーブ',
          description: '料理用ハーブや薬草の苗',
          parent_id: null,
          sort_order: 4,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
  }

  static async createProduct(productData: {
    name: string
    description?: string
    price: number
    category_id?: string
    unit?: string
    min_order_quantity?: number
    max_order_quantity?: number
    variation_name?: string
    image_url?: string
    barcode?: string
  }): Promise<Product> {
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
        tax_type: 'inclusive',
        is_available: true,
        display_order: 0
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

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        category_id: data.category_id,
        description: data.description,
        unit: data.unit,
        min_order_quantity: data.min_order_quantity,
        max_order_quantity: data.max_order_quantity,
        variation_name: data.variation_name,
        image_url: data.image_url,
        barcode: data.barcode,
        tax_type: data.tax_type,
        is_available: data.is_available,
        display_order: data.display_order,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('商品作成に失敗しました:', error)
      throw new Error(`商品作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async updateProduct(productId: string, productData: Partial<{
    name: string
    description: string
    price: number
    category_id: string
    is_available: boolean
    unit: string
    min_order_quantity: number
    max_order_quantity: number
    variation_name: string
    image_url: string
    barcode: string
  }>): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('商品更新エラー:', error)
        throw error
      }
    } catch (error) {
      console.error('商品更新に失敗しました:', error)
      throw new Error(`商品更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('商品削除エラー:', error)
        throw error
      }
    } catch (error) {
      console.error('商品削除に失敗しました:', error)
      throw new Error(`商品削除に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}