import { supabaseAdmin } from '@/lib/supabase';
import type { Reservation } from '@/types/database';

/**
 * 予約履歴管理サービス
 * 24時間後の自動データ移行とアーカイブ機能
 */
export class ReservationHistoryService {
  
  /**
   * 完了した予約を履歴テーブルに移動（24時間経過後）
   */
  static async moveCompletedReservationsToHistory(): Promise<{moved: number, errors: number}> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    try {
      console.log('🔄 Starting completed reservations migration to history...');
      
      // 24時間以上前に完了した予約を取得
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      
      const { data: completedReservations, error: selectError } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('status', 'completed')
        .lt('updated_at', cutoffDate.toISOString());

      if (selectError) {
        console.error('❌ Error selecting completed reservations:', selectError);
        throw selectError;
      }

      if (!completedReservations || completedReservations.length === 0) {
        console.log('✅ No completed reservations to move');
        return { moved: 0, errors: 0 };
      }

      console.log(`📦 Found ${completedReservations.length} completed reservations to move`);

      let moved = 0;
      let errors = 0;

      for (const reservation of completedReservations) {
        try {
          // 履歴テーブルに挿入
          const historyData = {
            id: reservation.id,
            preset_id: reservation.preset_id,
            user_name: reservation.user_name,
            furigana: reservation.furigana,
            gender: reservation.gender,
            birthday: reservation.birthday,
            phone_number: reservation.phone_number,
            zip_code: reservation.zip_code,
            address1: reservation.address1,
            address2: reservation.address2,
            comment: reservation.comment,
            selected_products: reservation.selected_products,
            pickup_date: reservation.pickup_date,
            total_amount: reservation.total_amount,
            original_status: reservation.status,
            line_user_id: reservation.line_user_id,
            original_created_at: reservation.created_at,
            original_updated_at: reservation.updated_at,
            moved_to_history_at: new Date().toISOString()
          };

          const { error: insertError } = await supabaseAdmin
            .from('reservation_history')
            .insert(historyData);

          if (insertError) {
            console.error(`❌ Error inserting reservation ${reservation.id} into history:`, insertError);
            errors++;
            continue;
          }

          // 元のテーブルから削除
          const { error: deleteError } = await supabaseAdmin
            .from('reservations')
            .delete()
            .eq('id', reservation.id);

          if (deleteError) {
            console.error(`❌ Error deleting reservation ${reservation.id}:`, deleteError);
            errors++;
            continue;
          }

          moved++;
          console.log(`✅ Moved reservation ${reservation.id} to history`);

        } catch (error) {
          console.error(`❌ Error processing reservation ${reservation.id}:`, error);
          errors++;
        }
      }

      console.log(`🎉 Migration completed: ${moved} moved, ${errors} errors`);
      return { moved, errors };

    } catch (error) {
      console.error('❌ Error in moveCompletedReservationsToHistory:', error);
      throw error;
    }
  }

  /**
   * キャンセルされた予約を履歴テーブルに移動（7日経過後）
   */
  static async moveCancelledReservationsToHistory(): Promise<{moved: number, errors: number}> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    try {
      console.log('🔄 Starting cancelled reservations migration to history...');
      
      // 7日以上前にキャンセルされた予約を取得
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const { data: cancelledReservations, error: selectError } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .eq('status', 'cancelled')
        .lt('updated_at', cutoffDate.toISOString());

      if (selectError) {
        console.error('❌ Error selecting cancelled reservations:', selectError);
        throw selectError;
      }

      if (!cancelledReservations || cancelledReservations.length === 0) {
        console.log('✅ No cancelled reservations to move');
        return { moved: 0, errors: 0 };
      }

      console.log(`📦 Found ${cancelledReservations.length} cancelled reservations to move`);

      let moved = 0;
      let errors = 0;

      for (const reservation of cancelledReservations) {
        try {
          // 履歴テーブルに挿入
          const historyData = {
            id: reservation.id,
            preset_id: reservation.preset_id,
            user_name: reservation.user_name,
            furigana: reservation.furigana,
            gender: reservation.gender,
            birthday: reservation.birthday,
            phone_number: reservation.phone_number,
            zip_code: reservation.zip_code,
            address1: reservation.address1,
            address2: reservation.address2,
            comment: reservation.comment,
            selected_products: reservation.selected_products,
            pickup_date: reservation.pickup_date,
            total_amount: reservation.total_amount,
            original_status: reservation.status,
            line_user_id: reservation.line_user_id,
            original_created_at: reservation.created_at,
            original_updated_at: reservation.updated_at,
            moved_to_history_at: new Date().toISOString()
          };

          const { error: insertError } = await supabaseAdmin
            .from('reservation_history')
            .insert(historyData);

          if (insertError) {
            console.error(`❌ Error inserting cancelled reservation ${reservation.id} into history:`, insertError);
            errors++;
            continue;
          }

          // 元のテーブルから削除
          const { error: deleteError } = await supabaseAdmin
            .from('reservations')
            .delete()
            .eq('id', reservation.id);

          if (deleteError) {
            console.error(`❌ Error deleting cancelled reservation ${reservation.id}:`, deleteError);
            errors++;
            continue;
          }

          moved++;
          console.log(`✅ Moved cancelled reservation ${reservation.id} to history`);

        } catch (error) {
          console.error(`❌ Error processing cancelled reservation ${reservation.id}:`, error);
          errors++;
        }
      }

      console.log(`🎉 Cancelled migration completed: ${moved} moved, ${errors} errors`);
      return { moved, errors };

    } catch (error) {
      console.error('❌ Error in moveCancelledReservationsToHistory:', error);
      throw error;
    }
  }

  /**
   * 履歴データの検索
   */
  static async searchHistory(params: {
    phone_number?: string;
    user_name?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{data: import('@/types/database').ReservationHistory[], count: number}> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    try {
      let query = supabaseAdmin
        .from('reservation_history')
        .select('*', { count: 'exact' });

      // 検索条件の適用
      if (params.phone_number) {
        query = query.ilike('phone_number', `%${params.phone_number}%`);
      }

      if (params.user_name) {
        query = query.ilike('user_name', `%${params.user_name}%`);
      }

      if (params.date_from) {
        query = query.gte('original_created_at', params.date_from);
      }

      if (params.date_to) {
        query = query.lte('original_created_at', params.date_to);
      }

      if (params.status) {
        query = query.eq('original_status', params.status);
      }

      // ページング
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query
        .order('moved_to_history_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error searching history:', error);
        throw error;
      }

      return {
        data: data || [],
        count: count || 0
      };

    } catch (error) {
      console.error('❌ Error in searchHistory:', error);
      throw error;
    }
  }

  /**
   * 古い履歴データのアーカイブ（1年経過後）
   */
  static async archiveOldHistory(): Promise<{archived: number, errors: number}> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    try {
      console.log('📦 Starting old history archival...');
      
      // 1年以上前の履歴データを取得
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      
      const { data: oldHistory, error: selectError } = await supabaseAdmin
        .from('reservation_history')
        .select('id, user_name, phone_number, moved_to_history_at')
        .lt('moved_to_history_at', cutoffDate.toISOString());

      if (selectError) {
        console.error('❌ Error selecting old history:', selectError);
        throw selectError;
      }

      if (!oldHistory || oldHistory.length === 0) {
        console.log('✅ No old history to archive');
        return { archived: 0, errors: 0 };
      }

      console.log(`📦 Found ${oldHistory.length} old history records to archive`);

      // 実際の実装では、S3やCloud Storageにエクスポートする
      // ここでは削除のみ実装
      let archived = 0;
      let errors = 0;

      for (const history of oldHistory) {
        try {
          const { error: deleteError } = await supabaseAdmin
            .from('reservation_history')
            .delete()
            .eq('id', history.id);

          if (deleteError) {
            console.error(`❌ Error archiving history ${history.id}:`, deleteError);
            errors++;
            continue;
          }

          archived++;

        } catch (error) {
          console.error(`❌ Error processing history ${history.id}:`, error);
          errors++;
        }
      }

      console.log(`🎉 Archive completed: ${archived} archived, ${errors} errors`);
      return { archived, errors };

    } catch (error) {
      console.error('❌ Error in archiveOldHistory:', error);
      throw error;
    }
  }

  /**
   * 統計情報の取得
   */
  static async getHistoryStats(): Promise<{
    total_history: number;
    completed_count: number;
    cancelled_count: number;
    oldest_record: string | null;
    newest_record: string | null;
  }> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    try {
      // 総履歴数
      const { count: totalCount } = await supabaseAdmin
        .from('reservation_history')
        .select('*', { count: 'exact', head: true });

      // 完了数
      const { count: completedCount } = await supabaseAdmin
        .from('reservation_history')
        .select('*', { count: 'exact', head: true })
        .eq('original_status', 'completed');

      // キャンセル数  
      const { count: cancelledCount } = await supabaseAdmin
        .from('reservation_history')
        .select('*', { count: 'exact', head: true })
        .eq('original_status', 'cancelled');

      // 最古・最新レコード
      const { data: oldest } = await supabaseAdmin
        .from('reservation_history')
        .select('moved_to_history_at')
        .order('moved_to_history_at', { ascending: true })
        .limit(1);

      const { data: newest } = await supabaseAdmin
        .from('reservation_history')
        .select('moved_to_history_at')
        .order('moved_to_history_at', { ascending: false })
        .limit(1);

      return {
        total_history: totalCount || 0,
        completed_count: completedCount || 0,
        cancelled_count: cancelledCount || 0,
        oldest_record: oldest?.[0]?.moved_to_history_at || null,
        newest_record: newest?.[0]?.moved_to_history_at || null
      };

    } catch (error) {
      console.error('❌ Error getting history stats:', error);
      throw error;
    }
  }
}

/**
 * バッチ処理のメイン関数
 */
export async function runHistoryMaintenance(): Promise<void> {
  console.log('🚀 Starting reservation history maintenance...');
  
  try {
    // 完了した予約を履歴に移行
    const completedResult = await ReservationHistoryService.moveCompletedReservationsToHistory();
    console.log(`✅ Completed reservations moved: ${completedResult.moved}`);

    // キャンセルされた予約を履歴に移行
    const cancelledResult = await ReservationHistoryService.moveCancelledReservationsToHistory();
    console.log(`✅ Cancelled reservations moved: ${cancelledResult.moved}`);

    // 古い履歴をアーカイブ
    const archiveResult = await ReservationHistoryService.archiveOldHistory();
    console.log(`✅ Old history archived: ${archiveResult.archived}`);

    // 統計情報を表示
    const stats = await ReservationHistoryService.getHistoryStats();
    console.log('📊 History statistics:', stats);

    console.log('🎉 History maintenance completed successfully');

  } catch (error) {
    console.error('❌ Error in history maintenance:', error);
    throw error;
  }
}