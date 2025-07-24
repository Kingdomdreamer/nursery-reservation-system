import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { 
  FormConfigResponse, 
  Reservation, 
  ReservationFormData,
  ProductSelection,
  NotificationLog,
  NotificationType
} from '@/types';

export class DatabaseService {
  /**
   * Get form configuration for a specific preset
   */
  static async getFormConfig(presetId: number): Promise<FormConfigResponse | null> {
    try {
      // Get form settings
      const { data: formSettings, error: settingsError } = await supabase
        .from('form_settings')
        .select('*')
        .eq('preset_id', presetId)
        .eq('is_enabled', true)
        .single();

      if (settingsError) {
        console.error('Error fetching form settings:', settingsError);
        return null;
      }

      // Get products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        return null;
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

      return {
        form_settings: formSettings,
        products: products || [],
        pickup_windows: pickupWindows || [],
        preset: preset
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

      return { success: true, reservation };
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

      return reservations || [];
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
      let query = supabaseAdmin
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
        reservations: reservations || [], 
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
      const { error } = await supabaseAdmin
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
      const { error } = await supabaseAdmin
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
    message: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
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
      const { count: todayCount } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

      // Week's reservations
      const { count: weekCount } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart);

      // Month's reservations
      const { count: monthCount } = await supabaseAdmin
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Total revenue this month
      const { data: revenueData } = await supabaseAdmin
        .from('reservations')
        .select('total_amount')
        .gte('created_at', monthStart);

      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;

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
}