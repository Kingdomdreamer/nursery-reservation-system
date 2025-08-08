/**
 * データベースクエリ最適化ユーティリティ
 * Phase 5 - 作業14: パフォーマンス最適化
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

interface QueryOptions {
  enableCache?: boolean;
  cacheTime?: number; // TTL in milliseconds
  select?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

interface QueryBuilder {
  table: string;
  filters: Array<{ column: string; operator: string; value: any }>;
  joins: Array<{ table: string; on: string; select?: string }>;
  options: QueryOptions;
}

export class DatabaseQueryOptimizer {
  private cache: QueryCache = {};
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * キャッシュされたクエリの実行
   */
  async executeWithCache<T>(
    cacheKey: string,
    queryFn: () => Promise<{ data: T; error: any }>,
    cacheTime: number = 5 * 60 * 1000 // 5分
  ): Promise<{ data: T; error: any; fromCache?: boolean }> {
    // キャッシュチェック
    const cached = this.cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.log(`[QueryOptimizer] Cache hit for key: ${cacheKey}`);
      return { data: cached.data, error: null, fromCache: true };
    }

    // キャッシュミス - クエリ実行
    console.log(`[QueryOptimizer] Cache miss for key: ${cacheKey}, executing query`);
    const result = await queryFn();
    
    if (!result.error && result.data) {
      // キャッシュに保存
      this.cache[cacheKey] = {
        data: result.data,
        timestamp: Date.now(),
        ttl: cacheTime
      };
    }

    return result;
  }

  /**
   * プリセット設定の最適化クエリ
   */
  async getPresetConfig(presetId: number, useCache: boolean = true) {
    const cacheKey = `preset_config_${presetId}`;
    
    const queryFn = async () => {
      // 最適化されたクエリ - 必要なフィールドのみ選択
      return await this.supabase
        .from('product_presets')
        .select(`
          id,
          preset_name,
          description,
          form_expiry_date,
          is_active,
          form_settings (
            enable_birthday,
            enable_gender,
            enable_furigana,
            required_fields,
            optional_fields
          ),
          preset_products!inner (
            id,
            pickup_start,
            pickup_end,
            display_order,
            product:products!inner (
              id,
              name,
              variation_name,
              price,
              tax_type,
              visible
            )
          )
        `)
        .eq('id', presetId)
        .eq('is_active', true)
        .eq('preset_products.is_active', true)
        .eq('preset_products.product.visible', true)
        .order('display_order', { foreignTable: 'preset_products' })
        .single();
    };

    if (useCache) {
      return await this.executeWithCache(cacheKey, queryFn, 10 * 60 * 1000); // 10分キャッシュ
    }

    return await queryFn();
  }

  /**
   * 商品リストの最適化クエリ
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    search?: string;
    categoryId?: number;
    visible?: boolean;
    useCache?: boolean;
  } = {}) {
    const {
      limit = 50,
      offset = 0,
      search,
      categoryId,
      visible = true,
      useCache = true
    } = options;

    const cacheKey = `products_${JSON.stringify({ limit, offset, search, categoryId, visible })}`;

    const queryFn = async () => {
      let query = this.supabase
        .from('products')
        .select(`
          id,
          product_code,
          name,
          variation_name,
          price,
          tax_type,
          visible,
          display_order
        `)
        .eq('visible', visible)
        .range(offset, offset + limit - 1)
        .order('display_order', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,product_code.ilike.%${search}%`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      return await query;
    };

    if (useCache) {
      return await this.executeWithCache(cacheKey, queryFn, 5 * 60 * 1000); // 5分キャッシュ
    }

    return await queryFn();
  }

  /**
   * 予約リストの最適化クエリ
   */
  async getReservations(options: {
    limit?: number;
    offset?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    useCache?: boolean;
  } = {}) {
    const {
      limit = 20,
      offset = 0,
      status,
      dateFrom,
      dateTo,
      useCache = false // 予約データは頻繁に変更されるためデフォルトでキャッシュなし
    } = options;

    const cacheKey = `reservations_${JSON.stringify({ limit, offset, status, dateFrom, dateTo })}`;

    const queryFn = async () => {
      let query = this.supabase
        .from('reservations')
        .select(`
          id,
          user_name,
          phone_number,
          total_amount,
          status,
          pickup_date,
          created_at,
          selected_products
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      return await query;
    };

    if (useCache) {
      return await this.executeWithCache(cacheKey, queryFn, 2 * 60 * 1000); // 2分キャッシュ
    }

    return await queryFn();
  }

  /**
   * 管理ダッシュボード統計の最適化クエリ
   */
  async getDashboardStats(useCache: boolean = true) {
    const cacheKey = 'dashboard_stats';
    
    const queryFn = async () => {
      // 並列でクエリを実行
      const [
        reservationsCount,
        activePresetsCount,
        productsCount,
        pendingReservationsCount,
        recentReservations
      ] = await Promise.all([
        this.supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true }),
        
        this.supabase
          .from('product_presets')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        this.supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('visible', true),
        
        this.supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        
        this.supabase
          .from('reservations')
          .select(`
            id,
            user_name,
            total_amount,
            status,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        data: {
          stats: {
            total_reservations: reservationsCount.count || 0,
            active_presets: activePresetsCount.count || 0,
            total_products: productsCount.count || 0,
            pending_reservations: pendingReservationsCount.count || 0
          },
          recent_reservations: recentReservations.data || []
        },
        error: null
      };
    };

    if (useCache) {
      return await this.executeWithCache(cacheKey, queryFn, 2 * 60 * 1000); // 2分キャッシュ
    }

    return await queryFn();
  }

  /**
   * バッチ処理用の最適化クエリ
   */
  async batchUpdateReservationStatus(
    reservationIds: string[], 
    newStatus: string
  ): Promise<{ data: any; error: any }> {
    console.log(`[QueryOptimizer] Batch updating ${reservationIds.length} reservations to status: ${newStatus}`);
    
    // バッチサイズでチャンクに分割
    const batchSize = 50;
    const chunks = [];
    
    for (let i = 0; i < reservationIds.length; i += batchSize) {
      chunks.push(reservationIds.slice(i, i + batchSize));
    }

    try {
      // 並列でバッチ更新を実行
      const promises = chunks.map(chunk => 
        this.supabase
          .from('reservations')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .in('id', chunk)
      );

      const results = await Promise.all(promises);
      
      // エラーチェック
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('[QueryOptimizer] Batch update errors:', errors);
        return { data: null, error: errors[0].error };
      }

      const totalUpdated = results.length;
      console.log(`[QueryOptimizer] Successfully updated ${totalUpdated} reservations`);

      return { data: { updated_count: totalUpdated }, error: null };

    } catch (error) {
      console.error('[QueryOptimizer] Batch update failed:', error);
      return { data: null, error };
    }
  }

  /**
   * キャッシュの手動無効化
   */
  invalidateCache(pattern?: string) {
    if (pattern) {
      // パターンマッチでキャッシュを無効化
      const regex = new RegExp(pattern);
      Object.keys(this.cache).forEach(key => {
        if (regex.test(key)) {
          delete this.cache[key];
          console.log(`[QueryOptimizer] Invalidated cache key: ${key}`);
        }
      });
    } else {
      // 全キャッシュを無効化
      this.cache = {};
      console.log('[QueryOptimizer] All cache invalidated');
    }
  }

  /**
   * 期限切れキャッシュの自動クリーンアップ
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    Object.keys(this.cache).forEach(key => {
      const cached = this.cache[key];
      if ((now - cached.timestamp) >= cached.ttl) {
        delete this.cache[key];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`[QueryOptimizer] Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * インデックス最適化の提案
   */
  getIndexSuggestions(): string[] {
    return [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status ON reservations(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_pickup_date ON reservations(pickup_date);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_visible ON products(visible, display_order);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preset_products_active ON preset_products(preset_id, is_active);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_settings_preset_id ON form_settings(preset_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_presets_active ON product_presets(is_active, form_expiry_date);'
    ];
  }

  /**
   * クエリパフォーマンス統計の取得
   */
  getCacheStats() {
    const totalEntries = Object.keys(this.cache).length;
    const now = Date.now();
    const expiredEntries = Object.values(this.cache).filter(
      cached => (now - cached.timestamp) >= cached.ttl
    ).length;

    return {
      total_entries: totalEntries,
      expired_entries: expiredEntries,
      active_entries: totalEntries - expiredEntries,
      cache_size_kb: Math.round(JSON.stringify(this.cache).length / 1024)
    };
  }
}

// シングルトンインスタンス
let optimizerInstance: DatabaseQueryOptimizer | null = null;

export const getQueryOptimizer = (supabase: SupabaseClient) => {
  if (!optimizerInstance) {
    optimizerInstance = new DatabaseQueryOptimizer(supabase);
    
    // 定期的なキャッシュクリーンアップを設定
    setInterval(() => {
      optimizerInstance?.cleanupExpiredCache();
    }, 10 * 60 * 1000); // 10分ごと
  }
  
  return optimizerInstance;
};