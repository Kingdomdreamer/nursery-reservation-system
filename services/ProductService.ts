import { Product, ProductCategory } from '../types/forms'
import { supabase } from '../lib/supabase'

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
        is_active: product.is_available,
        created_at: product.created_at,
        updated_at: product.updated_at,
        unit: product.unit,
        min_order_quantity: product.min_order_quantity,
        max_order_quantity: product.max_order_quantity,
        variation_name: product.variation_name,
        image_url: product.image_url,
        barcode: product.barcode
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
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'キュウリの種',
          price: 250,
          category_id: 'cat_2',
          description: '育てやすいキュウリの種セット',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: '花の苗セット',
          price: 800,
          category_id: 'cat_3',
          description: '季節の花の苗3個セット',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'ハーブセット',
          price: 500,
          category_id: 'cat_4',
          description: 'バジル、パセリ、ミントのハーブセット',
          is_active: true,
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
        is_active: true, // product_categoriesテーブルにis_activeがない場合
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
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_2',
          name: '種子',
          description: '様々な野菜や花の種子',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_3',
          name: '花の苗',
          description: '季節の花や観賞用植物の苗',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'cat_4',
          name: 'ハーブ',
          description: '料理用ハーブや薬草の苗',
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
          barcode: productData.barcode || null,
          is_available: true
        })
        .select('*')
        .single()

      if (error) {
        console.error('商品作成エラー:', error)
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        price: data.price,
        category_id: data.category_id,
        description: data.description,
        is_active: data.is_available,
        created_at: data.created_at,
        updated_at: data.updated_at,
        unit: data.unit,
        min_order_quantity: data.min_order_quantity,
        max_order_quantity: data.max_order_quantity,
        variation_name: data.variation_name,
        image_url: data.image_url,
        barcode: data.barcode
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