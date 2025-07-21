import { supabase, Product, ProductCategory } from '../lib/supabase'

export class ProductService {
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
      // バーコードの正規化（空文字列をnullに変換）
      const normalizedBarcode = productData.barcode?.trim() || null
      
      // バーコードの重複チェック（バーコードが指定されている場合）
      if (normalizedBarcode) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('barcode', normalizedBarcode)
          .single()
        
        if (existingProduct) {
          throw new Error('このバーコードは既に登録されています。別のバーコードを使用してください。')
        }
      }
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description || null,
          price: productData.price,
          category_id: productData.category_id || null,
          unit: productData.unit || null,
          min_order_quantity: productData.min_order_quantity || 1,
          max_order_quantity: productData.max_order_quantity || null,
          variation_name: productData.variation_name || null,
          image_url: productData.image_url || null,
          barcode: normalizedBarcode,
          tax_type: 'inclusive',
          is_available: true,
          display_order: 0
        })
        .select('*')
        .single()

      if (error) {
        console.error('商品作成エラー（詳細）:', JSON.stringify(error, null, 2))
        
        // 409 Conflictエラーの場合、より具体的なエラーメッセージを提供
        if (error.code === '23505') { // PostgreSQL unique violation
          const detail = error.details || error.message || ''
          if (detail.includes('barcode')) {
            throw new Error('このバーコードは既に登録されています。別のバーコードを使用してください。')
          } else if (detail.includes('name')) {
            throw new Error('この商品名は既に登録されています。別の商品名を使用してください。')
          } else {
            throw new Error('この商品情報は既に登録されています。重複する項目を確認してください。')
          }
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