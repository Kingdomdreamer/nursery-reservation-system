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

    // 税率チェック
    if (row.tax_rate && (isNaN(Number(row.tax_rate)) || Number(row.tax_rate) < 0 || Number(row.tax_rate) > 100)) {
      errors.push({
        row: rowIndex,
        field: 'tax_rate',
        message: '税率は0-100の数値で入力してください',
        data: row
      });
    }

    // 税タイプチェック
    if (row.tax_type && !['inclusive', 'exclusive'].includes(row.tax_type)) {
      errors.push({
        row: rowIndex,
        field: 'tax_type',
        message: '税タイプはinclusiveまたはexclusiveで入力してください',
        data: row
      });
    }

    // 価格タイプチェック
    if (row.price_type && !['fixed', 'department', 'weight'].includes(row.price_type)) {
      errors.push({
        row: rowIndex,
        field: 'price_type',
        message: '価格タイプはfixed、department、weightのいずれかで入力してください',
        data: row
      });
    }

    // 単位タイプチェック
    if (row.unit_type && !['piece', 'kg', 'g'].includes(row.unit_type)) {
      errors.push({
        row: rowIndex,
        field: 'unit_type',
        message: '単位タイプはpiece、kg、gのいずれかで入力してください',
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
    let baseProductName = undefined;
    let variationName = undefined;
    let variationType = undefined;
    
    if (row.base_name?.trim() && row.variation?.trim()) {
      baseProductName = row.base_name.trim();
      variationName = row.variation.trim();
      variationType = 'price'; // デフォルトは価格バリエーション
      productName = `${baseProductName}（${variationName}）`;
    }

    return {
      name: productName,
      external_id: row.external_id?.trim() || undefined,
      category_id: row.category_id ? parseInt(row.category_id) : undefined,
      price: parseInt(row.price),
      
      // バリエーション管理フィールド
      base_product_name: baseProductName,
      variation_name: variationName,
      variation_type: variationType,
      
      // POSシステム連携フィールド
      product_code: row.product_code?.trim() || undefined,
      barcode: row.barcode?.trim() || undefined,
      
      // 税設定フィールド
      tax_type: (row.tax_type?.trim() as 'inclusive' | 'exclusive') || 'exclusive',
      tax_rate: row.tax_rate ? parseFloat(row.tax_rate) : 10.00,
      
      // 価格設定フィールド
      price_type: (row.price_type?.trim() as 'fixed' | 'department' | 'weight') || 'fixed',
      
      // 販売・表示設定
      unit_type: (row.unit_type?.trim() as 'piece' | 'kg' | 'g') || 'piece',
      
      // システム設定
      visible: row.visible?.toLowerCase() !== 'false',
      point_eligible: row.point_eligible?.toLowerCase() !== 'false',
      receipt_print: true,
      
      // メモがあれば設定
      memo: row.memo?.trim() || row.comment?.trim() || undefined,
      
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
    let baseProductName = row['商品名'].trim();
    let variationName = undefined;
    let variationType = undefined;
    
    if (row['バリエーション（種別1）']?.trim()) {
      variationName = row['バリエーション（種別1）'].trim();
      variationType = 'price'; // デフォルトは価格バリエーション
      productName = `${baseProductName}（${variationName}）`;
    }

    // 税設定の変換
    const taxType = row['税設定'] === '内税' ? 'inclusive' : 'exclusive';
    const taxRate = row['適用税率'] === '軽減税率' ? 8.00 : 10.00;
    
    // 価格設定の変換
    const priceType = row['価格設定'] === '部門打ち' ? 'department' : 
                     row['価格設定'] === '量り売り' ? 'weight' : 'fixed';

    return {
      name: productName,
      
      // バリエーション管理フィールド
      base_product_name: variationName ? baseProductName : undefined,
      variation_name: variationName,
      variation_type: variationType,
      
      // POSシステム連携フィールド
      product_code: row['商品コード']?.trim() || undefined,
      barcode: row['バーコード']?.trim() || undefined,
      
      // 税設定フィールド
      tax_type: taxType,
      tax_rate: taxRate,
      
      // 価格設定フィールド
      price_type: priceType,
      
      // 基本情報
      category_id: row['カテゴリーID'] ? parseInt(row['カテゴリーID']) : undefined,
      price: parseInt(row['価格']),
      
      // 追加の価格・コスト情報
      price2: row['価格2'] ? parseInt(row['価格2']) : undefined,
      cost_price: row['原価'] ? parseInt(row['原価']) : undefined,
      
      // 販売・表示設定
      unit_id: row['販売単位ID'] ? parseInt(row['販売単位ID']) : undefined,
      unit_type: (row['単位タイプ']?.trim() as 'piece' | 'kg' | 'g') || 'piece',
      unit_weight: row['単位重量'] ? parseFloat(row['単位重量']) : undefined,
      
      // システム設定
      visible: row['表示/非表示'] !== '非表示',
      point_eligible: row['ポイント付与対象'] === '対象',
      receipt_print: row['レシート印字設定'] !== '対象外',
      
      // その他
      receipt_name: row['レシート用商品名']?.trim() || undefined,
      input_name: row['商品入力用名称']?.trim() || undefined,
      memo: row['備考']?.trim() || undefined,
      old_product_code: row['旧商品コード']?.trim() || undefined,
      analysis_tag_id: row['分析タグID'] ? parseInt(row['分析タグID']) : undefined,
      
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
    return `name,external_id,category_id,price,variation,comment,base_name,product_code,barcode,tax_type,tax_rate,price_type,unit_type,visible,point_eligible,memo
野菜セットA,VEG001,1,1000,,春の野菜を詰め合わせ,,VEG001,,exclusive,10.00,fixed,piece,true,true,新鮮な野菜のセット
野菜セットB,VEG002,1,1500,,夏の野菜を詰め合わせ,,VEG002,,exclusive,10.00,fixed,piece,true,true,季節の野菜セット
果物セット（小サイズ）,FRUIT001,2,1500,小サイズ,季節の果物3種類,果物セット,FRUIT001,,exclusive,8.00,fixed,piece,true,true,小さな果物セット
果物セット（大サイズ）,FRUIT002,2,2500,大サイズ,季節の果物5種類,果物セット,FRUIT002,,exclusive,8.00,fixed,piece,true,true,大きな果物セット`;
  }

  static generatePOSTemplate(): string {
    return `カテゴリーID,商品名,価格,バリエーション（種別1）,税設定,適用税率,価格設定,商品コード,バーコード,ポイント付与対象,表示/非表示,価格2,原価,販売単位ID,単位タイプ,単位重量,レシート印字設定,レシート用商品名,商品入力用名称,備考,旧商品コード,分析タグID
1,種粕 20kg,1800,通常価格,外税,標準税率,通常,#2000000000619,#2000000000619,対象,表示,,1500,1,個,,対象,種粕 20kg,種粕,伝統的な種粕,,
1,種粕 20kg,1700,売出価格,外税,標準税率,通常,#2000000000077,#2000000000077,対象,表示,,1500,1,個,,対象,種粕 20kg(売出),種粕,セール価格,,
1,種粕ペレット 20kg,1900,通常価格,外税,標準税率,通常,#2000000000053,#2000000000053,対象,表示,,1700,1,個,,対象,種粕ペレット 20kg,ペレット,ペレットタイプの種粕,,`;
  }
}