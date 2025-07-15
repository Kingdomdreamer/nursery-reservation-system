'use client'

import { useState, useEffect } from 'react'
import { ReservationService, ReservationItem } from '../../lib/services/ReservationService'

export default function ReservationList() {
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [filteredReservations, setFilteredReservations] = useState<ReservationItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        const data = await ReservationService.getAllReservations()
        setReservations(data)
        setFilteredReservations(data)
      } catch (error) {
        console.error('Failed to fetch reservations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
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

  const updateReservationStatus = async (id: string, newStatus: ReservationItem['status']) => {
    const success = await ReservationService.updateReservationStatus(id, newStatus)
    if (success) {
      setReservations(prev =>
        prev.map(res =>
          res.id === id ? { ...res, status: newStatus } : res
        )
      )
    } else {
      alert('ステータスの更新に失敗しました')
    }
  }

  const getStatusBadge = (status: ReservationItem['status']) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${ReservationService.getStatusColor(status)}`}>
        {ReservationService.formatStatus(status)}
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
              <option value="ready">準備完了</option>
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
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-300 rounded w-28"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </td>
                  </tr>
                ))
              ) : filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    予約データがありません
                  </td>
                </tr>
              )}
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
                      <option value="ready">準備完了</option>
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