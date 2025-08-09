import { supabaseAdmin } from '@/lib/supabase';
import type { 
  StandardCSVRow, 
  POSCSVRow, 
  CSVImportResult, 
  CSVImportError 
} from '@/types/csv';
import type { Product, ProductCreateInput } from '@/types/database';
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

    const validProducts: ProductCreateInput[] = [];

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

    const validProducts: ProductCreateInput[] = [];

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
    } else if (row.name.length > 255) {
      errors.push({
        row: rowIndex,
        field: 'name',
        message: '商品名は255文字以内で入力してください',
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

    // 商品コードチェック（重複チェックは除く）
    if (row.product_code && row.product_code.trim().length > 50) {
      errors.push({
        row: rowIndex,
        field: 'product_code',
        message: '商品コードは50文字以内で入力してください',
        data: row
      });
    }

    // バーコードチェック
    if (row.barcode && row.barcode.trim().length > 50) {
      errors.push({
        row: rowIndex,
        field: 'barcode',
        message: 'バーコードは50文字以内で入力してください',
        data: row
      });
    }

    // 税区分チェック
    if (row.tax_type && !['内税', '外税'].includes(row.tax_type)) {
      errors.push({
        row: rowIndex,
        field: 'tax_type',
        message: '税区分は「内税」または「外税」で入力してください',
        data: row
      });
    }

    // 表示順チェック
    if (row.display_order && (isNaN(Number(row.display_order)) || Number(row.display_order) < 0)) {
      errors.push({
        row: rowIndex,
        field: 'display_order',
        message: '表示順は0以上の数値で入力してください',
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
    } else if (row['商品名'].length > 255) {
      errors.push({
        row: rowIndex,
        field: '商品名',
        message: '商品名は255文字以内で入力してください',
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
   * 実際のproductsテーブル構造に合わせて修正
   */
  private static convertStandardRowToProduct(row: StandardCSVRow): ProductCreateInput {
    // 商品名の決定（バリエーション対応）
    let productName = row.name.trim();
    let variationName = '通常価格';
    
    // バリエーション名が指定されている場合
    if (row.variation_name?.trim()) {
      variationName = row.variation_name.trim();
    }

    // 実際のproductsテーブル構造に合わせたデータ変換
    return {
      name: productName,
      product_code: row.product_code?.trim() || undefined,
      variation_id: 1, // デフォルト値
      variation_name: variationName,
      tax_type: (row.tax_type?.trim() as '内税' | '外税') || '内税',
      price: parseInt(row.price) || 0,
      barcode: row.barcode?.trim() || undefined,
      visible: row.visible?.toLowerCase() !== 'false',
      display_order: row.display_order ? parseInt(row.display_order) : 0
    };
  }

  /**
   * POS形式データを商品データに変換
   * 実際のproductsテーブル構造に合わせて修正
   */
  private static convertPOSRowToProduct(row: POSCSVRow): ProductCreateInput {
    // 商品名の決定
    let productName = row['商品名'].trim();
    let variationName = '通常価格';
    
    // バリエーション名が指定されている場合
    if (row['バリエーション（種別1）']?.trim()) {
      variationName = row['バリエーション（種別1）'].trim();
      productName = `${productName}（${variationName}）`;
    }

    // 税設定の変換
    const taxType = row['税設定'] === '内税' ? '内税' : '外税';
    
    // 実際のproductsテーブル構造に合わせたデータ変換
    return {
      name: productName,
      product_code: row['商品コード']?.trim() || undefined,
      variation_id: 1, // デフォルト値
      variation_name: variationName,
      tax_type: taxType,
      price: parseInt(row['価格']) || 0,
      barcode: row['バーコード']?.trim() || undefined,
      visible: row['表示/非表示'] !== '非表示',
      display_order: 0
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
    return `name,product_code,variation_name,tax_type,price,barcode,visible,display_order
野菜セットA,VSET-A,通常価格,内税,1000,,true,1
野菜セットB,VSET-B,通常価格,内税,1500,,true,2
果物セット（小サイズ）,FSET-S,小サイズ,内税,1500,,true,3
果物セット（大サイズ）,FSET-L,大サイズ,内税,2500,,true,4`;
  }

  static generatePOSTemplate(): string {
    return `商品名,商品コード,バリエーション（種別1）,税設定,価格,バーコード,表示/非表示
種粕 20kg,TANEKASU-20,通常価格,内税,1800,,表示
種粕ペレット 20kg,TANEKASU-P20,通常価格,内税,1900,,表示
野菜セット,VSET-STD,通常価格,内税,1200,,表示
野菜セット,VSET-S,小サイズ,内税,1000,,表示
野菜セット,VSET-L,大サイズ,内税,1500,,表示`;
  }
}