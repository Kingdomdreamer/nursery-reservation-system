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
    console.log('=== POS CSV Import Service Started ===');
    console.log('CSV text length:', csvText.length);
    
    try {
      console.log('Parsing POS CSV...');
      const rows = this.parsePOSCSV(csvText);
      console.log('Parsed rows:', rows.length);
      console.log('Sample row:', JSON.stringify(rows[0], null, 2));
      
      console.log('Processing POS rows...');
      const result = await this.processPOSRows(rows);
      console.log('POS CSV import service completed successfully');
      return result;
    } catch (error) {
      console.error('=== POS CSV Import Service Error ===');
      console.error('Error in importPOSCSV:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      throw new Error(`CSVインポート処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
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
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row as unknown as StandardCSVRow);
    }

    return rows;
  }

  /**
   * POS形式CSVパーサー
   */
  private static parsePOSCSV(csvText: string): POSCSVRow[] {
    console.log('=== Parsing POS CSV ===');
    const lines = csvText.trim().split('\n');
    console.log('CSV lines count:', lines.length);
    console.log('First line (headers):', lines[0]);
    
    if (lines.length < 2) {
      console.log('CSV has insufficient data (less than 2 lines)');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('Parsed headers:', headers);
    
    const rows: POSCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Processing line ${i}:`, line);
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      console.log(`Parsed values for line ${i}:`, values);
      
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      console.log(`Created row object for line ${i}:`, row);
      rows.push(row as unknown as POSCSVRow);
    }

    console.log('Total parsed POS CSV rows:', rows.length);
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
          console.error('=== CRITICAL DATABASE ERROR (Standard CSV) ===');
          console.error('Supabase admin client is not available');
          console.error('Environment variables status:');
          console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
          console.error('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
          console.error('- NODE_ENV:', process.env.NODE_ENV);
          console.error('Available SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
          
          throw new Error('Supabaseサービスロールキーが設定されていないため、データベースにアクセスできません。Vercelの環境変数設定を確認してください。');
        }

        console.log(`Attempting to insert ${validProducts.length} products to database (Standard CSV)`);
        console.log('Sample product:', JSON.stringify(validProducts[0], null, 2));

        const { data: insertedProducts, error } = await supabaseAdmin
          .from('products')
          .insert(validProducts)
          .select();

        if (error) {
          console.error('Database insert error details (Standard CSV):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw new Error(`データベース挿入エラー: ${error.message} (Code: ${error.code})`);
        }

        console.log(`Successfully inserted ${insertedProducts?.length || 0} products (Standard CSV)`);
        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];

        // プリセット関連付け
        if (presetId && insertedProducts) {
          try {
            await this.linkProductsToPreset(insertedProducts, presetId);
            result.warnings.push(
              `${insertedProducts.length}個の商品をプリセット${presetId}に関連付けました`
            );
          } catch (linkError) {
            console.warn('Failed to link products to preset:', linkError);
            result.warnings.push(
              `商品は作成されましたが、プリセット${presetId}への関連付けに失敗しました`
            );
          }
        }
      } catch (error) {
        console.error('Database insertion failed (Standard CSV):', error);
        throw new InvalidProductDataError(error);
      }
    }

    return result;
  }

  /**
   * POS形式データの処理
   */
  private static async processPOSRows(rows: POSCSVRow[]): Promise<CSVImportResult> {
    console.log(`Processing ${rows.length} POS CSV rows`);
    
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
        console.log(`Row ${rowIndex} converted:`, productData);
      } catch (error) {
        console.error(`Row ${rowIndex} conversion error:`, error);
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
          console.error('=== CRITICAL DATABASE ERROR ===');
          console.error('Supabase admin client is not available');
          console.error('Environment variables status:');
          console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
          console.error('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
          console.error('- NODE_ENV:', process.env.NODE_ENV);
          console.error('Available SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
          
          throw new Error('Supabaseサービスロールキーが設定されていないため、データベースにアクセスできません。Vercelの環境変数設定を確認してください。');
        }

        console.log(`Attempting to insert ${validProducts.length} products to database`);
        console.log('Sample product:', JSON.stringify(validProducts[0], null, 2));

        // データベース挿入を実行
        console.log('Executing database insert...');
        console.log('Supabase admin client status:', {
          isNull: supabaseAdmin === null,
          hasFromMethod: supabaseAdmin ? typeof supabaseAdmin.from === 'function' : false
        });
        
        const { data: insertedProducts, error } = await supabaseAdmin
          .from('products')
          .insert(validProducts)
          .select();

        console.log('Database insert response:', {
          hasData: !!insertedProducts,
          dataLength: insertedProducts?.length || 0,
          hasError: !!error,
          errorMessage: error?.message
        });

        if (error) {
          console.error('Database insert error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error
          });
          throw new Error(`データベース挿入エラー: ${error.message} (Code: ${error.code})`);
        }

        console.log(`Successfully inserted ${insertedProducts?.length || 0} products`);
        result.success = insertedProducts?.length || 0;
        result.insertedProducts = insertedProducts || [];
      } catch (error) {
        console.error('Database insertion failed:', error);
        if (error instanceof Error) {
          throw new InvalidProductDataError(error);
        } else {
          throw new InvalidProductDataError(new Error('不明なデータベースエラー'));
        }
      }
    } else {
      console.log('No valid products to insert');
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
    console.log(`=== Validating POS row ${rowIndex} ===`);
    console.log('Row data:', row);
    
    const errors: CSVImportError[] = [];

    // 商品名チェック
    console.log('Checking 商品名:', row['商品名']);
    if (!row['商品名']?.trim()) {
      const error = {
        row: rowIndex,
        field: '商品名',
        message: '商品名は必須です',
        data: row
      };
      console.log('商品名 error:', error);
      errors.push(error);
    } else if (row['商品名'].length > 255) {
      const error = {
        row: rowIndex,
        field: '商品名',
        message: '商品名は255文字以内で入力してください',
        data: row
      };
      console.log('商品名 length error:', error);
      errors.push(error);
    }

    // 価格チェック
    console.log('Checking 価格:', row['価格']);
    if (!row['価格']?.trim()) {
      const error = {
        row: rowIndex,
        field: '価格',
        message: '価格は必須です',
        data: row
      };
      console.log('価格 missing error:', error);
      errors.push(error);
    } else if (isNaN(Number(row['価格'])) || Number(row['価格']) < 0) {
      const error = {
        row: rowIndex,
        field: '価格',
        message: '正しい価格を入力してください（0以上の数値）',
        data: row
      };
      console.log('価格 invalid error:', error);
      errors.push(error);
    }

    console.log(`Validation result for row ${rowIndex}: ${errors.length} errors`);
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
    console.log('Converting POS row:', row);
    
    // 商品名の決定
    let productName = row['商品名'].trim();
    let variationName = '通常価格';
    
    // バリエーション名が指定されている場合
    if (row['バリエーション（種別1）']?.trim()) {
      variationName = row['バリエーション（種別1）'].trim();
      productName = `${productName}（${variationName}）`;
    }

    // 税設定の変換
    const taxType: '内税' | '外税' = row['税設定'] === '内税' ? '内税' : '外税';
    
    // 実際のproductsテーブル構造に合わせたデータ変換
    const result = {
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
    
    console.log('Converted product:', result);
    return result;
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