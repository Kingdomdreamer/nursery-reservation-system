import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ProductCreateInput, TaxType, ProductImportData, ImportResult, ImportError, ImportWarning } from '@/types/database';

/**
 * 商品CSV一括インポートAPI
 * CSVファイルを解析して商品を一括登録する
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'データベース接続が利用できません' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'CSVファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'CSVファイルをアップロードしてください' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (10MB以内)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'ファイルサイズは10MB以内である必要があります' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSVファイルにデータがありません' },
        { status: 400 }
      );
    }

    // ヘッダー解析
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['商品名', '価格'];
    const optionalHeaders = ['商品コード', 'バリエーション名', '税区分', 'バーコード', '表示', '表示順'];
    
    // 必須ヘッダーのチェック
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        success: false,
        error: `必須ヘッダーが不足です: ${missingHeaders.join(', ')}`,
        details: {
          expected_headers: [...requiredHeaders, ...optionalHeaders],
          found_headers: headers
        }
      }, { status: 400 });
    }

    // データ解析とバリデーション
    const importData: ProductImportData[] = [];
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        errors.push({
          row: rowNumber,
          message: `ヘッダー数とデータ数が一致しません (ヘッダー:${headers.length}, データ:${values.length})`,
          data: { headers: headers.length, values: values.length }
        });
        continue;
      }
      
      const row: any = {};
      
      // 各列のデータをマッピング
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j].trim();
        
        switch (header) {
          case '商品名':
            if (!value) {
              errors.push({ row: rowNumber, field: '商品名', message: '商品名は必須です' });
            } else if (value.length > 255) {
              errors.push({ row: rowNumber, field: '商品名', message: '商品名は255文字以内で入力してください' });
            } else {
              row.name = value;
            }
            break;
            
          case '価格':
            const price = parseFloat(value);
            if (isNaN(price) || price < 0) {
              errors.push({ row: rowNumber, field: '価格', message: '価格は0以上の数値である必要があります' });
            } else {
              row.price = price;
            }
            break;
            
          case '商品コード':
            if (value) {
              row.product_code = value;
            }
            break;
            
          case 'バリエーション名':
            row.variation_name = value || '通常価格';
            break;
            
          case '税区分':
            if (value && !['内税', '外税'].includes(value)) {
              warnings.push({ row: rowNumber, field: '税区分', message: `税区分は「内税」または「外税」である必要があります。デフォルトで「内税」を使用します。` });
              row.tax_type = '内税';
            } else {
              row.tax_type = (value as TaxType) || '内税';
            }
            break;
            
          case 'バーコード':
            if (value) {
              row.barcode = value;
            }
            break;
            
          case '表示':
            if (value) {
              const visible = value.toLowerCase() === 'true' || value === '1' || value === 'はい';
              row.visible = visible;
            }
            break;
        }
      }
      
      // 基本バリデーションをパスした行を追加
      if (row.name && row.price !== undefined) {
        importData.push(row as ProductImportData);
      }
    }

    // エラーがある場合は処理を停止
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `CSVファイルに${errors.length}件のエラーがあります`,
        details: { errors, warnings }
      }, { status: 400 });
    }

    if (importData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'インポート可能なデータがありません' },
        { status: 400 }
      );
    }

    // 商品コードの重複チェック
    const productCodes = importData
      .map(item => item.product_code)
      .filter(code => code) as string[];
      
    if (productCodes.length > 0) {
      const { data: existingProducts } = await supabaseAdmin
        .from('products')
        .select('product_code')
        .in('product_code', productCodes);
        
      if (existingProducts && existingProducts.length > 0) {
        const duplicateCodes = existingProducts.map(p => p.product_code);
        return NextResponse.json({
          success: false,
          error: '既存の商品コードが含まれています',
          details: {
            duplicate_codes: duplicateCodes,
            message: '重複する商品コードを修正してから再度インポートしてください'
          }
        }, { status: 400 });
      }
    }

    // データベースにインサート
    const insertData: any[] = importData.map((item, index) => ({
      name: item.name,
      variation_name: item.variation_name || '通常価格',
      tax_type: item.tax_type || '内税',
      price: item.price,
      product_code: item.product_code,
      barcode: item.barcode,
      visible: item.visible !== undefined ? item.visible : true,
      display_order: index + 1
    }));

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(insertData)
      .select();

    if (error) {
      console.error('商品インポートエラー:', error);
      return NextResponse.json({
        success: false,
        error: 'データベースへのインサートに失敗しました',
        details: { db_error: error.message }
      }, { status: 500 });
    }

    const result: ImportResult = {
      imported: data?.length || 0,
      errors,
      warnings
    };

    return NextResponse.json({
      success: true,
      data: result,
      message: `${result.imported}件の商品を正常にインポートしました`
    });
  } catch (err) {
    console.error('CSVインポートAPI エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * CSV行を解析するユーティリティ関数
 * ダブルクォートやコンマが含まれたフィールドに対応
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * CSVインポート用テンプレートダウンロードAPI
 */
export async function GET() {
  try {
    const csvContent = [
      '商品名,価格,商品コード,バリエーション名,税区分,バーコード,表示',
      'りんご,100,APPLE001,通常価格,内税,1234567890123,true',
      'みかん,120,ORANGE001,特価,外税,1234567890124,true',
      'バナナ,80,BANANA001,通常価格,内税,,false'
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="product_import_template.csv"'
      }
    });
  } catch (err) {
    console.error('テンプレートダウンロードAPI エラー:', err);
    return NextResponse.json(
      { success: false, error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}