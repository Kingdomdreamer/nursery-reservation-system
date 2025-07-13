// モックデータ - Supabase接続がない場合のフォールバック

export const mockProducts = [
  {
    id: '1',
    category_id: 'cat1',
    name: 'トマトの苗',
    description: '中玉トマトの苗です。甘味が強く、育てやすい品種です。',
    price: 200,
    unit: '株',
    stock_quantity: 50,
    min_order_quantity: 1,
    max_order_quantity: 20,
    image_url: null,
    is_available: true,
    seasonal_availability: null,
    display_order: 1,
    barcode: '4901234567890',
    variation_name: '通常価格',
    tax_type: 'inclusive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat1',
      name: '苗',
      description: '野菜の苗類',
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    category_id: 'cat1',
    name: 'きゅうりの苗',
    description: 'シャキシャキとした食感のきゅうりが収穫できます。',
    price: 180,
    unit: '株',
    stock_quantity: 8, // 在庫少のテスト
    min_order_quantity: 1,
    max_order_quantity: 15,
    image_url: null,
    is_available: true,
    seasonal_availability: null,
    display_order: 2,
    barcode: '4901234567891',
    variation_name: '通常価格',
    tax_type: 'inclusive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat1',
      name: '苗',
      description: '野菜の苗類',
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    category_id: 'cat2',
    name: '有機肥料A',
    description: '野菜用の有機肥料です。土壌を豊かにします。',
    price: 850,
    unit: '袋',
    stock_quantity: 25,
    min_order_quantity: 1,
    max_order_quantity: 5,
    image_url: null,
    is_available: true,
    seasonal_availability: null,
    display_order: 3,
    barcode: '4901234567892',
    variation_name: '5kg袋',
    tax_type: 'inclusive',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat2',
      name: '肥料',
      description: '有機肥料、化成肥料各種',
      display_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
]

export const mockCategories = [
  {
    id: 'cat1',
    name: '苗',
    description: '野菜の苗類',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat2',
    name: '肥料',
    description: '有機肥料、化成肥料各種',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat3',
    name: '種',
    description: '野菜や花の種類',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockCustomers = [
  {
    id: 'cust1',
    full_name: '田中太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
    postal_code: '123-4567',
    prefecture: '東京都',
    city: '渋谷区',
    address_line1: '渋谷1-1-1',
    address_line2: 'マンション101',
    birth_date: '1980-01-01',
    notes: null,
    line_user_id: null,
    preferred_contact_method: 'phone',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cust2',
    full_name: '佐藤花子',
    email: 'sato@example.com',
    phone: '080-9876-5432',
    postal_code: '456-7890',
    prefecture: '大阪府',
    city: '大阪市',
    address_line1: '梅田2-2-2',
    address_line2: null,
    birth_date: '1975-05-15',
    notes: 'LINE通知希望',
    line_user_id: 'line123',
    preferred_contact_method: 'line',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const mockReservations = [
  {
    id: 'res1',
    reservation_number: 'R20240701001',
    customer_id: 'cust1',
    status: 'confirmed' as const,
    reservation_date: '2024-07-15',
    pickup_time_start: '10:00',
    pickup_time_end: '12:00',
    total_amount: 600,
    discount_amount: 0,
    final_amount: 600,
    notes: 'できるだけ早めにお願いします',
    admin_notes: null,
    payment_status: 'unpaid' as const,
    payment_method: null,
    confirmation_sent_at: new Date().toISOString(),
    reminder_sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: mockCustomers[0],
    reservation_items: [
      {
        id: 'item1',
        reservation_id: 'res1',
        product_id: '1',
        quantity: 3,
        unit_price: 200,
        subtotal: 600,
        notes: null,
        created_at: new Date().toISOString(),
        product: mockProducts[0]
      }
    ]
  },
  {
    id: 'res2',
    reservation_number: 'R20240701002',
    customer_id: 'cust2',
    status: 'pending' as const,
    reservation_date: '2024-07-16',
    pickup_time_start: '14:00',
    pickup_time_end: '16:00',
    total_amount: 360,
    discount_amount: 0,
    final_amount: 360,
    notes: null,
    admin_notes: '在庫確認中',
    payment_status: 'unpaid' as const,
    payment_method: null,
    confirmation_sent_at: null,
    reminder_sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer: mockCustomers[1],
    reservation_items: [
      {
        id: 'item2',
        reservation_id: 'res2',
        product_id: '2',
        quantity: 2,
        unit_price: 180,
        subtotal: 360,
        notes: null,
        created_at: new Date().toISOString(),
        product: mockProducts[1]
      }
    ]
  }
]

export const mockLineTemplates = [
  {
    id: 'template1',
    name: '予約確定通知',
    type: 'reservation_confirmation' as const,
    subject: '予約確定のお知らせ',
    message: `{customer_name}様

ご予約いただきありがとうございます。
以下の内容で予約を確定いたしました。

■ 予約情報
予約番号: {reservation_id}
お客様名: {customer_name}
電話番号: {phone_number}
予約日時: {reservation_date}

■ 注文商品
{product_list}

■ 合計金額
{total_amount}円

ご質問がございましたら、お気軽にお電話ください。
{shop_name}
{shop_phone}`,
    variables: ['customer_name', 'reservation_id', 'phone_number', 'reservation_date', 'product_list', 'total_amount', 'shop_name', 'shop_phone'],
    isActive: true,
    lastModified: new Date()
  },
  {
    id: 'template2',
    name: '予約リマインダー',
    type: 'reservation_reminder' as const,
    subject: '予約のリマインド',
    message: `{customer_name}様

明日は予約の受け取り日です。

■ 予約情報
予約番号: {reservation_id}
受け取り予定日: {reservation_date}
受け取り時間: {pickup_time}

商品の準備ができましたので、お待ちしております。

{shop_name}
{shop_phone}`,
    variables: ['customer_name', 'reservation_id', 'reservation_date', 'pickup_time', 'shop_name', 'shop_phone'],
    isActive: true,
    lastModified: new Date()
  },
  {
    id: 'template3',
    name: '支払い確認通知',
    type: 'payment_confirmation' as const,
    subject: 'お支払い確認のお知らせ',
    message: `{customer_name}様

お支払いを確認いたしました。

■ 支払い情報
予約番号: {reservation_id}
支払い金額: {payment_amount}円
支払い方法: {payment_method}
支払い日時: {payment_date}

ありがとうございました。

{shop_name}`,
    variables: ['customer_name', 'reservation_id', 'payment_amount', 'payment_method', 'payment_date', 'shop_name'],
    isActive: true,
    lastModified: new Date()
  },
  {
    id: 'template4',
    name: 'キャンセル通知',
    type: 'cancellation' as const,
    subject: '予約キャンセルのお知らせ',
    message: `{customer_name}様

以下の予約をキャンセルいたしました。

■ キャンセル情報
予約番号: {reservation_id}
キャンセル日時: {cancellation_date}
キャンセル理由: {cancellation_reason}

またのご利用をお待ちしております。

{shop_name}
{shop_phone}`,
    variables: ['customer_name', 'reservation_id', 'cancellation_date', 'cancellation_reason', 'shop_name', 'shop_phone'],
    isActive: false,
    lastModified: new Date()
  }
]

// デモ用フラグ
export const isDemoMode = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co'
}