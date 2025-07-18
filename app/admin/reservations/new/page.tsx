'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Customer, Product, ProductCategory } from '../../../../lib/supabase'
import { useToast } from '../../../contexts/ToastContext'
import AdminLayout from '../../../components/admin/AdminLayout'

interface NewReservationData {
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  reservation_date: string
  pickup_time_start: string
  pickup_time_end: string
  notes: string
  admin_notes: string
  items: {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }[]
}

export default function NewReservationPage() {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  
  const [reservationData, setReservationData] = useState<NewReservationData>({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: '',
    pickup_time_start: '',
    pickup_time_end: '',
    notes: '',
    admin_notes: '',
    items: []
  })

  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('顧客データの取得に失敗:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(*)
        `)
        .eq('is_available', true)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('商品データの取得に失敗:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('カテゴリデータの取得に失敗:', error)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      setReservationData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.full_name,
        customer_phone: customer.phone,
        customer_email: customer.email || ''
      }))
      setIsNewCustomer(false)
    }
  }

  const handleNewCustomerToggle = () => {
    setIsNewCustomer(!isNewCustomer)
    if (!isNewCustomer) {
      setSelectedCustomer(null)
      setReservationData(prev => ({
        ...prev,
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        customer_email: ''
      }))
    }
  }

  const addProductToReservation = (product: Product) => {
    const existingItem = reservationData.items.find(item => item.product_id === product.id)
    
    if (existingItem) {
      setReservationData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        )
      }))
    } else {
      setReservationData(prev => ({
        ...prev,
        items: [...prev.items, {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          subtotal: product.price
        }]
      }))
    }
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setReservationData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.product_id !== productId)
      }))
    } else {
      setReservationData(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.product_id === productId
            ? { ...item, quantity, subtotal: quantity * item.unit_price }
            : item
        )
      }))
    }
  }

  const removeItem = (productId: string) => {
    setReservationData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId)
    }))
  }

  const calculateTotal = () => {
    return reservationData.items.reduce((total, item) => total + item.subtotal, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let customerId = reservationData.customer_id

      // 新規顧客の場合、顧客を作成
      if (isNewCustomer) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            full_name: reservationData.customer_name,
            phone: reservationData.customer_phone,
            email: reservationData.customer_email || null
          }])
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // 予約番号を生成
      const reservationNumber = `R${Date.now().toString().slice(-8)}`

      // 予約を作成
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([{
          reservation_number: reservationNumber,
          customer_id: customerId,
          reservation_date: reservationData.reservation_date,
          pickup_time_start: reservationData.pickup_time_start || null,
          pickup_time_end: reservationData.pickup_time_end || null,
          total_amount: calculateTotal(),
          final_amount: calculateTotal(),
          discount_amount: 0,
          status: 'pending',
          notes: reservationData.notes || null,
          admin_notes: reservationData.admin_notes || null
        }])
        .select()
        .single()

      if (reservationError) throw reservationError

      // 予約アイテムを作成
      const reservationItems = reservationData.items.map(item => ({
        reservation_id: reservation.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('reservation_items')
        .insert(reservationItems)

      if (itemsError) throw itemsError

      showSuccess('予約が作成されました', `予約番号: ${reservationNumber}`)
      
      // 予約一覧画面に戻る
      window.location.href = '/admin/reservations'
    } catch (error) {
      console.error('予約の作成に失敗:', error)
      showError('予約の作成に失敗しました', '予約の作成中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots: { start: string; end: string; label: string }[] = []
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const endHour = minute === 30 ? hour + 1 : hour
      const endMinute = minute === 30 ? 0 : minute + 30
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
      
      if (endHour <= 18) {
        timeSlots.push({ 
          start: startTime, 
          end: endTime, 
          label: `${startTime} - ${endTime}` 
        })
      }
    }
  }

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h2 fw-bold text-dark">新規予約追加</h1>
              <button 
                onClick={() => window.location.href = '/admin/reservations'}
                className="btn btn-outline-secondary"
              >
                <i className="bi bi-arrow-left me-2"></i>
                戻る
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* 顧客情報 */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">顧客情報</h5>
                </div>
                <div className="card-body">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newCustomer"
                      checked={isNewCustomer}
                      onChange={handleNewCustomerToggle}
                    />
                    <label className="form-check-label" htmlFor="newCustomer">
                      新規顧客
                    </label>
                  </div>

                  {!isNewCustomer ? (
                    <div className="mb-3">
                      <label className="form-label">既存顧客を選択</label>
                      <select
                        className="form-select"
                        value={selectedCustomer?.id || ''}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        required
                      >
                        <option value="">顧客を選択してください</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.full_name} ({customer.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">顧客名 *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={reservationData.customer_name}
                          onChange={(e) => setReservationData(prev => ({ ...prev, customer_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">電話番号 *</label>
                        <input
                          type="tel"
                          className="form-control"
                          value={reservationData.customer_phone}
                          onChange={(e) => setReservationData(prev => ({ ...prev, customer_phone: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">メールアドレス</label>
                        <input
                          type="email"
                          className="form-control"
                          value={reservationData.customer_email}
                          onChange={(e) => setReservationData(prev => ({ ...prev, customer_email: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 予約日時 */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">予約日時</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">受取日 *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reservationData.reservation_date}
                      onChange={(e) => setReservationData(prev => ({ ...prev, reservation_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">受取時間</label>
                    <select
                      className="form-select"
                      value={reservationData.pickup_time_start}
                      onChange={(e) => {
                        const selectedSlot = timeSlots.find(slot => slot.start === e.target.value)
                        if (selectedSlot) {
                          setReservationData(prev => ({
                            ...prev,
                            pickup_time_start: selectedSlot.start,
                            pickup_time_end: selectedSlot.end
                          }))
                        }
                      }}
                    >
                      <option value="">時間を選択してください</option>
                      {timeSlots.map(slot => (
                        <option key={slot.start} value={slot.start}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 商品選択 */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">商品選択</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {products.map(product => (
                      <div key={product.id} className="col-md-4 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-title">{product.name}</h6>
                            <p className="card-text small text-muted">
                              {product.category?.name}
                            </p>
                            <p className="card-text">
                              <strong>¥{product.price.toLocaleString()}</strong>
                            </p>
                            <button
                              type="button"
                              className="btn btn-sm text-white"
                              style={{ 
                                background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                                border: 'none'
                              }}
                              onClick={() => addProductToReservation(product)}
                            >
                              <i className="bi bi-plus"></i> 追加
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 選択した商品 */}
            {reservationData.items.length > 0 && (
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">選択した商品</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>商品名</th>
                            <th>単価</th>
                            <th>数量</th>
                            <th>小計</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservationData.items.map(item => (
                            <tr key={item.product_id}>
                              <td>{item.product_name}</td>
                              <td>¥{item.unit_price.toLocaleString()}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm me-2"
                                    onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                                  >
                                    -
                                  </button>
                                  <span className="mx-2">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm ms-2"
                                    onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td>¥{item.subtotal.toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => removeItem(item.product_id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan={3}>合計</th>
                            <th>¥{calculateTotal().toLocaleString()}</th>
                            <th></th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 備考 */}
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">備考</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">顧客備考</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={reservationData.notes}
                      onChange={(e) => setReservationData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="顧客からの特別な要望など"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">管理メモ</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={reservationData.admin_notes}
                      onChange={(e) => setReservationData(prev => ({ ...prev, admin_notes: e.target.value }))}
                      placeholder="管理者向けメモ"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="col-12">
              <div className="d-flex justify-content-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => window.location.href = '/admin/reservations'}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading || reservationData.items.length === 0}
                  className="btn text-white"
                  style={{ 
                    background: 'linear-gradient(135deg, #8bc34a 0%, #7cb342 100%)',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      作成中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      予約を作成
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}