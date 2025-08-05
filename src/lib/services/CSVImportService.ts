import { supabaseAdmin } from '@/lib/supabase';
import type { 
  StandardCSVRow, 
  POSCSVRow, 
  CSVImportResult, 
  CSVImportError 
} from '@/types/csv';
import type { Product } from '@/types';
import { 
  InvalidProductDataError,
  PresetNotFoundError 
} from '@/types';

export class CSVImportService {
  /**
   * 標準形式CSVのインポート
   */
  static async importStandardCSV(
    csvText: string, 
    presetId?: number
  ): Promise<CSVImportResult> {
    const rows = this.parseStandardCSV(csvText);
    return await this.processStandardRows(rows, presetId);
  }

  /**
   * POS形式CSVのインポート
   */
  static async importPOSCSV(csvText: string): Promise<CSVImportResult> {
    const rows = this.parsePOSCSV(csvText);
    return await this.processPOSRows(rows);
  }

  /**
   * 標準形式CSVパーサー
   */
  private static parseStandardCSV(csvText: string): StandardCSVRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: StandardCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row as StandardCSVRow);
    }

    return rows;
  }

  /**
   * POS形式CSVパーサー
   */
  private static parsePOSCSV(csvText: string): POSCSVRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: POSCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row as POSCSVRow);
    }

    return rows;
  }

  /**
   * 標準形式データの処理
   */
  private static async processStandardRows(
    rows: StandardCSVRow[], 
    presetId?: number
  ): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: 0,
      total: rows.length,
      errors: [],
      warnings: [],
      insertedProducts: []
    };

    const validProducts: Omit<Product, 'id'>[] = [];

    // バリデーションとデータ変換
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      try {
        const validationErrors = this.validateStandardRow(row, rowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          continue;
        }

        const productData = this.convertStandardRowToProduct(row);
        validProducts.push(productData);
      } catch (error) {
        result.errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : '不明なエラー',
          data: row
        });
      }
    }

    // データベース挿入
    if (validProducts.length > 0) {
      try {
        if (!supabaseAdmin) {
          throw new Error('Database connection unavailable');
        }

        const { data: insertedProducts, error } = await supabaseAdmin
          .from('products')
          .insert(validProducts)
          .select();

        if (error) {
          throw error;
        }

        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];

        // プリセット関連付け
        if (presetId && insertedProducts) {
          await this.linkProductsToPreset(insertedProducts, presetId);
          result.warnings.push(
            `${insertedProducts.length}個の商品をプリセット${presetId}に関連付けました`
          );
        }
      } catch (error) {
        throw new InvalidProductDataError(error);
      }
    }

    return result;
  }

  /**
   * POS形式データの処理
   */
  private static async processPOSRows(rows: POSCSVRow[]): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: 0,
      total: rows.length,
      errors: [],
      warnings: [],
      insertedProducts: []
    };

    const validProducts: Omit<Product, 'id'>[] = [];

    // バリデーションとデータ変換
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2;

      try {
        const validationErrors = this.validatePOSRow(row, rowIndex);
        if (validationErrors.length > 0) {
          result.errors.push(...validationErrors);
          continue;
        }

        const productData = this.convertPOSRowToProduct(row);
        validProducts.push(productData);
      } catch (error) {
        result.errors.push({
          row: rowIndex,
          message: error instanceof Error ? error.message : '不明なエラー',
          data: row
        });
      }
    }

    // データベース挿入
    if (validProducts.length > 0) {
      try {
        if (!supabaseAdmin) {
          throw new Error('Database connection unavailable');
        }

        const { data: insertedProducts, error } = await supabaseAdmin
          .from('products')
          .insert(validProducts)
          .select();

        if (error) {
          throw error;
        }

        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];
      } catch (error) {
        throw new InvalidProductDataError(error);
      }
    }

    return result;
  }

  /**
   * 標準形式データのバリデーション
   */
  private static validateStandardRow(
    row: StandardCSVRow, 
    rowIndex: number
  ): CSVImportError[] {
    const errors: CSVImportError[] = [];

    // 商品名チェック
    if (!row.name?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: '商品名は必須です',
        data: row
      });
    } else if (row.name.length > 100) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: '商品名は100文字以内で入力してください',
        data: row
      });
    }

    // 価格チェック
    if (!row.price?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: '価格は必須です',
        data: row
      });
    } else if (isNaN(Number(row.price)) || Number(row.price) < 0) {
      errors.push({
        row: rowIndex,
        field: 'price',
        message: '正しい価格を入力してください（0以上の数値）',
        data: row
      });
    }

    // カテゴリIDチェック
    if (row.category_id && (isNaN(Number(row.category_id)) || Number(row.category_id) < 1)) {
      errors.push({
        row: rowIndex,
        field: 'category_id',
        message: 'カテゴリIDは正の整数で入力してください',
        data: row
      });
    }

    return errors;
  }

  /**
   * POS形式データのバリデーション
   */
  private static validatePOSRow(
    row: POSCSVRow, 
    rowIndex: number
  ): CSVImportError[] {
    const errors: CSVImportError[] = [];

    // 商品名チェック
    if (!row['商品名']?.trim()) {
      errors.push({
        row: rowIndex,
        field: '商品名',
        message: '商品名は必須です',
        data: row
      });
    } else if (row['商品名'].length > 100) {
      errors.push({
        row: rowIndex,
        field: '商品名',
        message: '商品名は100文字以内で入力してください',
        data: row
      });
    }

    // 価格チェック
    if (!row['価格']?.trim()) {
      errors.push({
        row: rowIndex,
        field: '価格',
        message: '価格は必須です',
        data: row
      });
    } else if (isNaN(Number(row['価格'])) || Number(row['価格']) < 0) {
      errors.push({
        row: rowIndex,
        field: '価格',
        message: '正しい価格を入力してください（0以上の数値）',
        data: row
      });
    }

    return errors;
  }

  /**
   * 標準形式データを商品データに変換
   */
  private static convertStandardRowToProduct(row: StandardCSVRow): Omit<Product, 'id'> {
    // 商品名の決定（バリエーション対応）
    let productName = row.name.trim();
    
    if (row.base_name?.trim() && row.variation?.trim()) {
      productName = `${row.base_name.trim()}（${row.variation.trim()}）`;
    }

    return {
      name: productName,
      external_id: row.external_id?.trim() || undefined,
      category_id: row.category_id ? parseInt(row.category_id) : undefined,
      price: parseInt(row.price),
      visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * POS形式データを商品データに変換
   */
  private static convertPOSRowToProduct(row: POSCSVRow): Omit<Product, 'id'> {
    // 商品名の決定（バリエーション対応）
    let productName = row['商品名'].trim();
    
    if (row['バリエーション（種別1）']?.trim()) {
      productName = `${productName}（${row['バリエーション（種別1）'].trim()}）`;
    }

    return {
      name: productName,
      product_code: row['商品コード']?.trim() || undefined,
      barcode: row['バーコード']?.trim() || undefined,
      category_id: row['カテゴリーID'] ? parseInt(row['カテゴリーID']) : undefined,
      price: parseInt(row['価格']),
      visible: row['表示/非表示'] !== '非表示',
      point_eligible: row['ポイント付与対象'] === '対象',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 商品をプリセットに関連付け
   */
  private static async linkProductsToPreset(
    products: Product[], 
    presetId: number
  ): Promise<void> {
    // プリセットの存在確認
    if (!supabaseAdmin) {
      throw new Error('Database connection unavailable');
    }
    
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('product_presets')
      .select('id')
      .eq('id', presetId)
      .single();

    if (presetError || !preset) {
      throw new PresetNotFoundError(presetId);
    }

    const presetProducts = products.map((product, index) => ({
      preset_id: presetId,
      product_id: product.id,
      display_order: index + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
      .from('preset_products')
      .insert(presetProducts);

    if (error) {
      throw error;
    }
  }

  /**
   * CSVテンプレートの生成
   */
  static generateStandardTemplate(): string {
    return `name,external_id,category_id,price,variation,comment,base_name
野菜セットA,VEG001,1,1000,,春の野菜を詰め合わせ,
野菜セットB,VEG002,1,1500,,夏の野菜を詰め合わせ,
果物セット（小サイズ）,FRUIT001,2,1500,小サイズ,季節の果物3種類,果物セット
果物セット（大サイズ）,FRUIT002,2,2500,大サイズ,季節の果物5種類,果物セット`;
  }

  static generatePOSTemplate(): string {
    return `カテゴリーID,商品名,価格,バリエーション（種別1）,税設定,適用税率,価格設定,商品コード,バーコード,ポイント付与対象,表示/非表示
1,種粕 20kg,1800,通常価格,外税,標準税率,通常,#2000000000619,#2000000000619,対象,表示
1,種粕 20kg,1700,売出価格,外税,標準税率,通常,#2000000000077,#2000000000077,対象,表示
1,種粕ペレット 20kg,1900,通常価格,外税,標準税率,通常,#2000000000053,#2000000000053,対象,表示`;
  }
}