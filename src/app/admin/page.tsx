'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DashboardStats, ReservationListItem } from '@/types';
import ReservationDetailModal from '@/components/admin/ReservationDetailModal';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<ReservationListItem[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ADMIN_PASSWORD = 'admin123'; // 本番環境では環境変数を使用

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      loadDashboardData();
    } else {
      setAuthError('パスワードが間違っています');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 予約データを取得
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          product_presets (
            preset_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reservationError) {
        console.error('予約データの取得エラー:', reservationError);
      } else {
        setReservations(reservationData || []);
      }

      // 統計データを計算
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayReservations = reservationData?.filter(r => 
        new Date(r.created_at || '') >= today
      ).length || 0;

      const weekReservations = reservationData?.filter(r => 
        new Date(r.created_at || '') >= weekAgo
      ).length || 0;

      const monthReservations = reservationData?.filter(r => 
        new Date(r.created_at || '') >= monthAgo
      ).length || 0;

      const totalRevenue = reservationData?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

      setStats({
        today_reservations: todayReservations,
        week_reservations: weekReservations,
        month_reservations: monthReservations,
        total_revenue: totalRevenue,
      });

    } catch (error) {
      console.error('ダッシュボードデータの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (reservation: ReservationListItem) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleReservationUpdate = () => {
    loadDashboardData(); // データを再読み込み
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            管理者ログイン
          </h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
              />
            </div>
            
            {authError && (
              <div className="text-red-600 text-sm">{authError}</div>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              ログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <>
            {/* 統計カード */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                  title="今日の予約"
                  value={stats.today_reservations}
                  color="blue"
                />
                <StatsCard
                  title="今週の予約"
                  value={stats.week_reservations}
                  color="green"
                />
                <StatsCard
                  title="今月の予約"
                  value={stats.month_reservations}
                  color="yellow"
                />
                <StatsCard
                  title="総売上"
                  value={`¥${stats.total_revenue.toLocaleString()}`}
                  color="purple"
                />
              </div>
            )}

            {/* 予約一覧 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">最近の予約</h2>
                
                {reservations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">予約データがありません</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            予約ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            顧客名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            電話番号
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            商品
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            金額
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            予約日時
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reservations.map((reservation) => (
                          <tr 
                            key={reservation.id}
                            onClick={() => handleRowClick(reservation)}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {reservation.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.phone_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.product?.join(', ') || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ¥{reservation.total_amount?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {reservation.created_at 
                                ? new Date(reservation.created_at).toLocaleString('ja-JP')
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 予約詳細モーダル */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={handleReservationUpdate}
        />
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatsCard({ title, value, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}