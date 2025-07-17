import { Product, ProductCategory } from '@/types/forms'

export class ProductService {
  static async getAllProducts(): Promise<Product[]> {
    // Mock implementation
    return [
      {
        id: '1',
        name: 'プレミアムケーキ',
        price: 5000,
        category_id: 'cat_1',
        description: '特別な日にぴったりのプレミアムケーキ',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'チョコレートタルト',
        price: 3500,
        category_id: 'cat_1',
        description: '濃厚なチョコレートの風味を楽しめるタルト',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'フルーツサンド',
        price: 1200,
        category_id: 'cat_2',
        description: '新鮮なフルーツをたっぷり使用したサンドイッチ',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'クロワッサン',
        price: 800,
        category_id: 'cat_2',
        description: 'サクサクとした食感のフランスパン',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  }

  static async getAllCategories(): Promise<ProductCategory[]> {
    // Mock implementation
    return [
      {
        id: 'cat_1',
        name: 'ケーキ・デザート',
        description: 'ケーキやタルトなどのデザート類',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'cat_2',
        name: 'パン・軽食',
        description: 'パンやサンドイッチなどの軽食',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]
  }
}