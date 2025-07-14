import { supabase, Product, ProductCategory } from '../../../lib/supabase'

export interface ProductCreateData {
  name: string
  category_id?: string
  description?: string
  price: number
  unit?: string
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
  price: number
  variation_name?: string
  tax_type?: string
  category_id?: string
  description?: string
  unit?: string
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
        unit: productData.unit || '個',
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
      errors: [] as string[]
    }

    for (const product of products) {
      try {
        if (product.id) {
          // 既存商品の更新
          await this.updateProduct(product.id, {
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            variation_name: product.variation_name,
            tax_type: product.tax_type || 'inclusive',
            category_id: product.category_id || undefined,
            description: product.description,
            unit: product.unit || '個'
          })
        } else {
          // 新規商品の追加
          await this.createProduct({
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            variation_name: product.variation_name,
            tax_type: product.tax_type || 'inclusive',
            category_id: product.category_id || undefined,
            description: product.description,
            unit: product.unit || '個',
            is_available: true,
            display_order: 0
          })
        }
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`商品「${product.name}」: ${error}`)
      }
    }

    return results
  }

  static parseCSV(csvText: string): CSVProduct[] {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const data: CSVProduct[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const product: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        switch (header.toLowerCase()) {
          case 'id':
            if (value) product.id = value
            break
          case 'name':
            product.name = value
            break
          case 'barcode':
            if (value) product.barcode = value
            break
          case 'price':
            product.price = parseFloat(value) || 0
            break
          case 'variation_name':
            if (value) product.variation_name = value
            break
          case 'tax_type':
            if (value) product.tax_type = value
            break
          case 'category_id':
            if (value) product.category_id = value
            break
          case 'description':
            if (value) product.description = value
            break
          case 'unit':
            if (value) product.unit = value
            break
        }
      })

      if (product.name && product.price !== undefined) {
        data.push(product)
      }
    }

    return data
  }

  static generateCSVTemplate(categories: ProductCategory[]): string {
    const headers = [
      'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
      'category_id', 'description', 'unit'
    ]
    
    const sampleData = [
      '', 'トマト苗', '4901234567890', '300', '通常価格', 'inclusive',
      categories[0]?.id || '', '中玉トマトの苗', '株'
    ]

    return headers.join(',') + '\n' + sampleData.join(',')
  }

  static async exportToCSV(): Promise<string> {
    const products = await this.getAllProducts()

    const headers = [
      'id', 'name', 'barcode', 'price', 'variation_name', 'tax_type',
      'category_id', 'description', 'unit'
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
        `"${product.description || ''}"`,
        product.unit
      ].join(','))
    ].join('\n')

    return csvContent
  }
}