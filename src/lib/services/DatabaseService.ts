import { supabase } from '@/lib/supabase';
import type { 
  FormConfigResponse, 
  Reservation, 
  ReservationFormData,
  ProductSelection,
  NotificationLog,
  NotificationType,
  FormSettings,
  Product,
  PickupWindow,
  ProductPreset
} from '@/types';

export class DatabaseService {
  /**
   * Get form configuration for a specific preset
   */
  static async getFormConfig(presetId: number): Promise<FormConfigResponse | null> {
    try {
      console.log('Fetching form config for preset:', presetId);
      
      // Get form settings
      const { data: formSettingsArray, error: settingsError } = await supabase
        .from('form_settings')
        .select('*')
        .eq('preset_id', presetId)
        .eq('is_enabled', true);

      const formSettings = formSettingsArray?.[0] || null;

      console.log('Form settings query result:', { formSettings, settingsError });

      if (settingsError) {
        console.error('Supabase query error details:', {
          message: settingsError.message,
          code: settingsError.code,
          details: settingsError.details,
          hint: settingsError.hint
        });
        return null;
      }

      if (!formSettings) {
        console.warn('No form settings found for preset:', presetId, 'with is_enabled=true');
        // プリセット自体が存在するかチェック
        const { data: presetExists, error: presetCheckError } = await supabase
          .from('product_presets')
          .select('id, preset_name')
          .eq('id', presetId)
          .single();
        
        if (presetCheckError || !presetExists) {
          console.error('Preset does not exist:', presetId, presetCheckError);
          
          // Get available presets for helpful error message
          const { data: availablePresets } = await supabase
            .from('product_presets')
            .select('id, preset_name')
            .order('id');
          
          console.log('Available presets:', availablePresets?.map(p => `${p.id}: ${p.preset_name}`));
          return null;
        } else {
          console.log(`Preset ${presetId} exists (${presetExists.preset_name}) but has no enabled form settings`);
          return null;
        }
      }

      // Get pickup windows
      const { data: pickupWindows, error: windowsError } = await supabase
        .from('pickup_windows')
        .select('*')
        .eq('preset_id', presetId)
        .order('pickup_start');

      if (windowsError) {
        console.error('Error fetching pickup windows:', windowsError);
        return null;
      }

      // If no pickup windows exist, create default ones
      let finalPickupWindows = pickupWindows || [];
      if (finalPickupWindows.length === 0) {
        console.warn(`No pickup windows found for preset ${presetId}, using default windows`);
        // Create default pickup windows as fallback
        finalPickupWindows = [
          {
            id: `default-${presetId}-1`,
            preset_id: presetId,
            pickup_start: '2025-08-10T09:00:00.000Z',
            pickup_end: '2025-08-10T12:00:00.000Z',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `default-${presetId}-2`,
            preset_id: presetId,
            pickup_start: '2025-08-10T13:00:00.000Z',
            pickup_end: '2025-08-10T17:00:00.000Z',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }

      // Get preset info
      const { data: preset, error: presetError } = await supabase
        .from('product_presets')
        .select('*')
        .eq('id', presetId)
        .single();

      if (presetError) {
        console.error('Error fetching preset:', presetError);
        return null;
      }

      // Get preset_products relationships
      const { data: presetProductsData, error: presetProductsError } = await supabase
        .from('preset_products')
        .select('product_id, display_order')
        .eq('preset_id', presetId)
        .eq('is_active', true)
        .order('display_order');

      if (presetProductsError) {
        console.error('Error fetching preset products:', presetProductsError);
        return null;
      }

      // Get product IDs from the preset_products
      const productIds = (presetProductsData || []).map(pp => pp.product_id);
      
      console.log(`Found ${productIds.length} product IDs for preset ${presetId}:`, productIds);

      // If no products are associated with this preset, return empty array
      if (productIds.length === 0) {
        console.warn(`No products associated with preset ${presetId}. This preset has no product associations in preset_products table.`);
        console.warn(`Available presets and their product counts should be checked in admin interface.`);
        return {
          form_settings: formSettings as unknown as FormSettings,
          products: [], // Explicitly return empty array - no fallback to all products
          pickup_windows: (pickupWindows || []) as unknown as PickupWindow[],
          preset: preset as unknown as ProductPreset
        };
      }

      // Get the actual product data
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('visible', true)
        .order('name');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return null;
      }

      // Sort products according to display_order from preset_products
      const sortedProducts = (productsData || []).sort((a, b) => {
        const aOrder = Number(presetProductsData?.find(pp => pp.product_id === a.id)?.display_order) || 999;
        const bOrder = Number(presetProductsData?.find(pp => pp.product_id === b.id)?.display_order) || 999;
        return aOrder - bOrder;
      });

      console.log(`Found ${sortedProducts.length} products for preset ${presetId}:`, sortedProducts.map(p => p.name));

      return {
        form_settings: formSettings as unknown as FormSettings,
        products: sortedProducts as unknown as Product[],
        pickup_windows: finalPickupWindows as unknown as PickupWindow[],
        preset: preset as unknown as ProductPreset
      };
    } catch (error) {
      console.error('Error in getFormConfig:', error);
      return null;
    }
  }

  /**
   * Create a new reservation
   */
  static async createReservation(
    userId: string, 
    formData: ReservationFormData,
    presetId: number
  ): Promise<{ success: boolean; reservation?: Reservation; error?: string }> {
    try {
      // Calculate total amount
      const totalAmount = formData.products.reduce((sum, product) => sum + product.total_price, 0);

      // Prepare reservation data
      const reservationData = {
        user_id: userId,
        product_preset_id: presetId,
        user_name: formData.user_name,
        furigana: formData.furigana || null,
        phone_number: formData.phone_number,
        zip: formData.zip || null,
        address: formData.address || null,
        product: formData.products.map(p => p.product_name),
        quantity: formData.products.reduce((sum, p) => sum + p.quantity, 0),
        unit_price: formData.products.length > 0 ? formData.products[0].unit_price : 0,
        total_amount: totalAmount,
        note: formData.note || null,
        pickup_date: Object.values(formData.pickup_dates)[0] || null,
      };

      // Insert reservation
      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating reservation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reservation: reservation as unknown as Reservation };
    } catch (error) {
      console.error('Error in createReservation:', error);
      return { success: false, error: 'Failed to create reservation' };
    }
  }

  /**
   * Get user's reservations
   */
  static async getUserReservations(userId: string): Promise<Reservation[]> {
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reservations:', error);
        return [];
      }

      return (reservations as unknown as Reservation[]) || [];
    } catch (error) {
      console.error('Error in getUserReservations:', error);
      return [];
    }
  }

  /**
   * Get all reservations for admin (with pagination)
   */
  static async getAllReservations(
    page = 1, 
    limit = 50,
    startDate?: string,
    endDate?: string
  ): Promise<{ reservations: Reservation[]; total: number }> {
    try {
      let query = supabase
        .from('reservations')
        .select('*', { count: 'exact' });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: reservations, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all reservations:', error);
        return { reservations: [], total: 0 };
      }

      return { 
        reservations: (reservations as unknown as Reservation[]) || [], 
        total: count || 0 
      };
    } catch (error) {
      console.error('Error in getAllReservations:', error);
      return { reservations: [], total: 0 };
    }
  }

  /**
   * Update reservation
   */
  static async updateReservation(
    reservationId: string, 
    updates: Partial<Reservation>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', reservationId);

      if (error) {
        console.error('Error updating reservation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateReservation:', error);
      return { success: false, error: 'Failed to update reservation' };
    }
  }

  /**
   * Delete reservation
   */
  static async deleteReservation(reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (error) {
        console.error('Error deleting reservation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteReservation:', error);
      return { success: false, error: 'Failed to delete reservation' };
    }
  }

  /**
   * Log notification
   */
  static async logNotification(
    userId: string,
    type: NotificationType,
    message: string | Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          type,
          message
        });

      if (error) {
        console.error('Error logging notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in logNotification:', error);
      return { success: false, error: 'Failed to log notification' };
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<{
    today_reservations: number;
    week_reservations: number;
    month_reservations: number;
    total_revenue: number;
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Today's reservations
      const { count: todayCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Week's reservations
      const { count: weekCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      // Month's reservations
      const { count: monthCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Total revenue this month
      const { data: revenueData } = await supabase
        .from('reservations')
        .select('total_amount')
        .gte('created_at', monthStart);

      const totalRevenue = revenueData?.reduce((sum, item: any) => sum + (item.total_amount || 0), 0) || 0;

      return {
        today_reservations: todayCount || 0,
        week_reservations: weekCount || 0,
        month_reservations: monthCount || 0,
        total_revenue: totalRevenue
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        today_reservations: 0,
        week_reservations: 0,
        month_reservations: 0,
        total_revenue: 0
      };
    }
  }

  /**
   * Create reservation with LINE notification support
   */
  static async createReservationWithLineSupport(data: {
    preset_id: number;
    user_name: string;
    phone: string;
    pickup_date: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    line_user_id?: string | null;
    total_amount: number;
    status?: string;
    note?: string | null;
  }): Promise<{ id: string; total_amount: number }> {
    try {
      const reservationData = {
        product_preset_id: data.preset_id,
        user_name: data.user_name,
        phone_number: data.phone,
        pickup_date: data.pickup_date,
        product: data.products.map(p => p.name),
        quantity: data.products.reduce((sum, p) => sum + p.quantity, 0),
        total_amount: data.total_amount,
        line_user_id: data.line_user_id,
        status: data.status || 'confirmed',
        note: data.note,
        products_json: JSON.stringify(data.products),
      };

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!reservation) {
        throw new Error('No reservation data returned');
      }

      return {
        id: String(reservation.id),
        total_amount: Number(reservation.total_amount) || data.total_amount,
      };
    } catch (error) {
      console.error('Error in createReservationWithLineSupport:', error);
      throw error;
    }
  }
}