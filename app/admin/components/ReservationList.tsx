'use client'

import { useState, useEffect } from 'react'

interface ReservationItem {
  id: string
  customerName: string
  phone: string
  email: string
  products: Array<{
    name: string
    quantity: number
    pickupDate: string
    price: number
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
  notes?: string
}

export default function ReservationList() {
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [filteredReservations, setFilteredReservations] = useState<ReservationItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null)

  useEffect(() => {
    // 実際の実装ではAPIから予約データを取得
    const mockData: ReservationItem[] = [
      {
        id: 'RES001',
        customerName: '田中太郎',
        phone: '090-1234-5678',
        email: 'tanaka@example.com',
        products: [
          { name: '有機肥料A', quantity: 2, pickupDate: '2024-01-20', price: 1500 },
          { name: 'トマト苗', quantity: 10, pickupDate: '2024-01-22', price: 200 }
        ],
        totalAmount: 5000,
        status: 'pending',
        createdAt: '2024-01-15T10:30:00',
        notes: '午前中の受け取り希望'
      },
      {
        id: 'RES002',
        customerName: '佐藤花子',
        phone: '080-9876-5432',
        email: 'sato@example.com',
        products: [
          { name: '除草剤B', quantity: 1, pickupDate: '2024-01-18', price: 2800 }
        ],
        totalAmount: 2800,
        status: 'confirmed',
        createdAt: '2024-01-14T14:20:00'
      },
      {
        id: 'RES003',
        customerName: '鈴木一郎',
        phone: '070-1111-2222',
        email: 'suzuki@example.com',
        products: [
          { name: '化成肥料C', quantity: 5, pickupDate: '2024-01-19', price: 1200 }
        ],
        totalAmount: 6000,
        status: 'completed',
        createdAt: '2024-01-13T16:45:00'
      }
    ]
    setReservations(mockData)
    setFilteredReservations(mockData)
  }, [])

  useEffect(() => {
    let filtered = reservations

    if (statusFilter !== 'all') {
      filtered = filtered.filter(res => res.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.phone.includes(searchTerm) ||
        res.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredReservations(filtered)
  }, [reservations, statusFilter, searchTerm])

  const updateReservationStatus = (id: string, newStatus: ReservationItem['status']) => {
    setReservations(prev =>
      prev.map(res =>
        res.id === id ? { ...res, status: newStatus } : res
      )
    )
  }

  const getStatusBadge = (status: ReservationItem['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: '保留中',
      confirmed: '確定',
      completed: '完了',
      cancelled: 'キャンセル'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">予約管理</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          新規予約追加
        </button>
      </div>

      {/* フィルター・検索 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">すべて</option>
              <option value="pending">保留中</option>
              <option value="confirmed">確定</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">検索</label>
            <input
              type="text"
              placeholder="顧客名、電話番号、予約IDで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 予約一覧 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予約日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reservation.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reservation.customerName}</div>
                    <div className="text-sm text-gray-500">{reservation.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {reservation.products.map((product, index) => (
                        <div key={index} className="mb-1">
                          {product.name} × {product.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{reservation.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reservation.createdAt).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit', 
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      詳細
                    </button>
                    {reservation.status === 'pending' && (
                      <button
                        onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        確定
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 予約詳細モーダル */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">予約詳細 - {selectedReservation.id}</h3>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">顧客名</label>
                    <p className="text-gray-900">{selectedReservation.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">電話番号</label>
                    <p className="text-gray-900">{selectedReservation.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">商品一覧</label>
                  <div className="mt-1 space-y-2">
                    {selectedReservation.products.map((product, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{product.name} × {product.quantity}</span>
                        <span>引取日: {product.pickupDate}</span>
                        <span>¥{(product.price * product.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg font-bold">合計金額: ¥{selectedReservation.totalAmount.toLocaleString()}</span>
                  <div className="space-x-2">
                    <select
                      value={selectedReservation.status}
                      onChange={(e) => {
                        updateReservationStatus(selectedReservation.id, e.target.value as ReservationItem['status'])
                        setSelectedReservation({ ...selectedReservation, status: e.target.value as ReservationItem['status'] })
                      }}
                      className="border border-gray-300 rounded px-3 py-1"
                    >
                      <option value="pending">保留中</option>
                      <option value="confirmed">確定</option>
                      <option value="completed">完了</option>
                      <option value="cancelled">キャンセル</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}